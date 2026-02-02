import archiver from 'archiver'
import {PassThrough} from 'stream'

const createZipFile = async (files : {name : string, buffer : Buffer}[]) : Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const buffers : Buffer[] = [];
    const archive = archiver("zip", { zlib : {level : 9 } });
    const stream = new PassThrough();

    stream.on("data", chunk => buffers.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(buffers)));
    stream.on("error", err => reject(err));

    archive.pipe(stream);

    files.forEach((file) => {
      archive.append(file.buffer, { name: `${file.name}.xlsx` })
    });

    archive.finalize()
  })
}

export default {
  createZipFile
}