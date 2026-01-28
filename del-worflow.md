  # JOB to build backend form-extraction-module code
  form-extraction-module:
    needs:
      - changes
    if: ${{ needs.changes.outputs.form-extraction-module == 'true' }}
    name: Build and Deploy Rule Builder Module
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set Up Tag
        run: echo "IMAGE_TAG=$(git rev-parse --short HEAD)" >> $GITHUB_ENV
      - name: Login to Azure
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - name: Login to ACR
        run: az acr login --name ${{ secrets.DEVELOPMENT_ACR_NAME }}
        working-directory: form-extraction-module
      - name: Build Docker Image
        run: |
          docker build -t ${{ secrets.DEVELOPMENT_ACR_LOGIN_SERVER }}/form-extraction-module:${{ env.IMAGE_TAG }} .
        working-directory: form-extraction-module
      - name: Push Docker Image to ACR
        run: docker push ${{ secrets.DEVELOPMENT_ACR_LOGIN_SERVER }}/form-extraction-module:${{ env.IMAGE_TAG }}
        working-directory: form-extraction-module

      - name: Cleanup old Docker tags in ACR (keep latest 10)
        run: |
          ACR_NAME=${{ secrets.DEVELOPMENT_ACR_NAME }}
          REPO_NAME="form-extraction-module"
          KEEP_LATEST=10

          echo "Cleaning up old tags for $REPO_NAME (keeping latest $KEEP_LATEST)..."

          # List tags sorted by last update descending and skip the latest $KEEP_LATEST
          tags_to_delete=$(az acr repository show-tags --name "$ACR_NAME" --repository "$REPO_NAME" --orderby time_desc --output tsv | tail -n +$((KEEP_LATEST + 1)))

          if [ -z "$tags_to_delete" ]; then
            echo "No old tags to delete."
          else
            for tag in $tags_to_delete; do
              echo "Deleting $REPO_NAME:$tag"
              az acr repository delete --name "$ACR_NAME" --image "$REPO_NAME:$tag" --yes
            done
          fi

      - name: Set up SSH key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEVELOPMENT_SSH_PRIVATE_KEY }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh-keyscan -H ${{ secrets.DEVELOPMENT_BACKEND_VM_HOST }} >> ~/.ssh/known_hosts
      - name: Fetch secrets and create .env file
        working-directory: form-extraction-module
        run: |
          KEY_VAULT_NAME=${{ secrets.DEVELOPMENT_KEY_VAULT_NAME }}
          ENV_FILE=".env.formextractionmodule"
          
          # Ensure Azure CLI is authenticated
          az account show > /dev/null 2>&1
          if [ $? -ne 0 ]; then
          echo "Error: Azure CLI is not authenticated. Run 'az login' first."
          exit 1
          fi
          
          # Fetch secrets from Azure Key Vault and write to .env file
          echo "Fetching secrets from Azure Key Vault: $KEY_VAULT_NAME"
          
          KEY_VAULT_URI=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "key-vault-uri" --query value -o tsv)
          MAIL_CLIENT_SECRET=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "mail-app-client-secret" --query value -o tsv)
          MAIL_CLIENT_ID=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "mail-app-client-id" --query value -o tsv)
          MAIL_TENANT_ID=$(az keyvault secret show --vault-name "$KEY_VAULT_NAME" --name "mail-app-tenant-id" --query value -o tsv)
                    
          # Write secrets to .env file
          cat <<EOF > $ENV_FILE
          SERVER_PORT=5011
          KEY_VAULT_URI=$KEY_VAULT_URI
          MAINDB_NAME=main-database-name
          MAINDB_PASSWORD=main-db-admin-password
          MAINDB_USERNAME=main-db-admin-username
          MAINDB_ENDPOINT=main-db-endpoint
          ORGDB_NAME=org-database-name
          ORGDB_PASSWORD=org-db-admin-password
          ORGDB_USERNAME=org-db-admin-username
          ORGDB_ENDPOINT=org-db-endpoint
          STORAGE_ACCOUNT_NAME = "storage-account-name"
          STORAGE_ACCOUNT_KEY = "storage-account-primary-key"
          ETL_CONTAINER_NAME = "etl-container-name"
          AZURE_STORAGE_CONNECTION_STRING = "storage-account-connection-string"
          MAIL_TENANT_ID=$MAIL_TENANT_ID
          MAIL_CLIENT_ID=$MAIL_CLIENT_ID
          MAIL_CLIENT_SECRET=$MAIL_CLIENT_SECRET
          EMAIL_FROM="ea-communications@certainti.ai"
          UUID_PREFIX="D001"
          KAFKA_BROKER=${{ secrets.DEVELOPMENT_KAFKA_BROKER }}
          VISION_AGENT_API_KEY=vision-agent-api-key
          EOF
          echo "$ENV_FILE file created successfully!"
      - name: Copy .env file to VM
        run: |
          scp -o StrictHostKeyChecking=no .env.formextractionmodule adminuser@${{ secrets.DEVELOPMENT_BACKEND_VM_HOST }}:/tmp/
        working-directory: form-extraction-module
      - name: SSH into VM and deploy
        run: |
          ssh -o StrictHostKeyChecking=no adminuser@${{ secrets.DEVELOPMENT_BACKEND_VM_HOST }} << 'EOF'
            sudo -s
            cd /app/backend

            # Ensure docker-compose.yml exists
            if [ ! -f "docker-compose.yml" ]; then
              echo "docker-compose.yml not found!"
              exit 1
            fi
            
            # Move .env file with sudo
            sudo mv /tmp/.env.formextractionmodule /app/backend/.env.formextractionmodule
            echo ".env file moved successfully!"
          
            # Update only the form-extraction-module image tag
            echo "Updating docker-compose.yml..."
            sed -i 's|image:.*form-extraction-module:.*|image: ${{ secrets.DEVELOPMENT_ACR_LOGIN_SERVER }}/form-extraction-module:${{ env.IMAGE_TAG }}|' docker-compose.yml
            echo "Docker Compose updated successfully!"
          
            # Login to ACR 
            az acr login --name ${{ secrets.DEVELOPMENT_ACR_NAME }}
            echo "Logged in to ACR successfully!"
          
            # Pull latest changes and restart
            if docker compose up -d --pull always --no-deps form-extraction-module; then
              echo "Deployment successful!"
              # Remove old stopped containers
              docker container prune -f || true
              # Remove unused images (keeps only the latest deployed version)
              docker image prune -af || true
            else
              echo "Deployment failed!"
              exit 1
            fi
          EOF