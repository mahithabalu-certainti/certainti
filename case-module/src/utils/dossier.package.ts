import archiver from "archiver";
import { PassThrough } from "stream";
import axios from "axios";
import { BlobServiceClient } from "@azure/storage-blob";

type ZipFile =
  | { name: string; buffer: Buffer; extension?: string }
  | { name: string; url: string; extension?: string }
  | { name: string; urls: string[]; extension?: string };

export async function createZipFile(files: ZipFile[]): Promise<Buffer> {
  const buffers: Buffer[] = [];
  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();

  return new Promise(async (resolve, reject) => {
    stream.on("data", chunk => buffers.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(buffers)));
    stream.on("error", reject);

    archive.on("error", reject);
    archive.pipe(stream);

    try {
      for (const file of files) {
        const ext = file.extension ?? ".pdf";
        if ("buffer" in file) {
          archive.append(file.buffer, {
            name: `${file.name}${ext}`,
          });
        }
        else if ("url" in file) {
          if(file.url !== null) {
            const response = await axios.get(file.url, {
            responseType: "stream",
            timeout: 30_000,
          });

          archive.append(response.data, {
            name: `${file.name}${ext}`,
          });
          }
        }
        else if ("urls" in file) {
          let index = 1;
          for (const url of file.urls) {
            if(url !== null) {
              const response = await axios.get(url, {
              responseType: "stream",
              timeout: 30_000,
            });

            archive.append(response.data, {
              name: `${file.name}_${index}${ext}`,
            });

            index++;
            }
          }
        }
      }

      await archive.finalize();
    } catch (err) {
      archive.abort();
      reject(err);
    }
  });
}

export async function uploadZipBufferToAzureBlob(
  zipBuffer: Buffer,
  zipName: string, // without extension
  account_id: string,
  task_number: string,
  account_number: string,
  flag?: string
): Promise<{
  url: string;
  name: string;
  extension: string;
  size: number;
}> {
  const connectionString = "DefaultEndpointsProtocol=https;AccountName=developmentthinkrd365sto;AccountKey=bA+y4AkC+tAFPmkvHmZP468ljeSGO/ZU4pzydMPqGbqUx5/DA/mhL37NZW/LE5ERO7CiIWmkfbYo+AStkr1jgg==;EndpointSuffix=core.windows.net"
    // await getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING as string);
    // const connectionString = "storage-account-connection-string";
    // const connectionString = await getSecret("storage-account-connection-string");
    // const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING as string

  const containerName = account_number.toLowerCase();
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  await containerClient.createIfNotExists();

  const timestamp = Date.now();
  const extension = ".zip";

  let blobName: string;
  if (flag === "cases") {
    blobName = `${account_id}/cases/${task_number}/${timestamp}-${zipName}${extension}`;
  } else if (flag === "data-mapper") {
    blobName = `${account_id}/data-mapper/${task_number ? task_number + "/" : ""}${timestamp}-${zipName}${extension}`;
  } else {
    blobName = `${account_id}/attachments/${timestamp}-${zipName}${extension}`;
  }

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(zipBuffer, {
    blobHTTPHeaders: {
      blobContentType: "application/zip",
    },
  });

  const sizeInMB = parseFloat(
    (zipBuffer.length / (1024 * 1024)).toFixed(2)
  );

  return {
    url: blockBlobClient.url,
    name: zipName,
    extension,
    size: sizeInMB,
  };
}

