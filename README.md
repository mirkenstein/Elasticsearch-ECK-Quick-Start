# Usefull Kibana Console Files

Hugging Face Model Deployment. 
[deploy_model.console](./kibana_console/deploy_model.console)

Pipeline using the deployed models for topic and sentiment analysis.
[bert-sentiment.console](kibana_console/bert-sentiment.console)


OpenAI Inference Completion Pipeline with the test
[llm-sentiment.console](kibana_console/llm-sentiment.console)

For local deployment the inference endpoint will look like this:
```shell
 PUT _inference/completion/openai-completion-local
{
    "service": "openai",
    "service_settings": {
        "api_key": "${OPEN_AI_API_KEY}",
        "model_id": "LLAMA ID"
        "url":"${MY_LOCAL_IP_GENERATE}"
    }
}
```
# Local Cluster Setup

We will be deploying a 3 node ECK on a local minikibe cluster.
For this we allocate 16GB memory and 8 CPUs.

Each elasticserch node gets a 4GB memory and 2 CPUs and has tall the
[node roles](https://www.elastic.co/guide/en/elasticsearch/reference/current/node-roles-overview.html) including the  `ml` role.

Recommended setup resource limit.
These changes will take effect upon a minikube delete and then a minikube start
```shell
minikube config set memory 16384
minikube config set cpus 6
````
  
## Minikube commands
```shell
 minikube service  --all  --url --namespace elk
```
# Quickstart Elastic ECK
The deployment provided here is taken from the ECK Quickstart with some minimal modification.
https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-deploy-eck.html

1. Deploy ECK operator:
```shell
kubectl create -f https://download.elastic.co/downloads/eck/2.16.1/crds.yaml
```
The ECK operator runs in the  `elastic-system` namespace.
We will deploy our cluster in the `elk` namespace
2. Setup prerequisites for the ELK cluster
            
Set your elasticsearch password in advance, Start the trial and add the S3 bucket credentials which will be used for snapshots. 


- ES User pass
```shell
kubectl create secret generic quickstart-es-elastic-user --from-literal=elastic=$ECK_ES_PASS
kubectl apply -f start-trial.yaml 
```
  
- Add S3 secrets for your snapshot  operations
```shell
kubectl create secret generic minio-credentials \
--from-literal=s3.client.default.access_key=$S3_ACCESS_KEY access_key \
--from-literal=s3.client.default.secret_key=$S3_SECRET_KEY
```

To retrieve elasticsearch password
```shell
kubectl get secret quickstart-es-elastic-user -o go-template='{{.data.elastic | base64decode }}'
```



3. Create Elastic-Kibana Cluster 
```shell
kubectl apply -f es-nodes.yaml 
kubectl apply  -f kibana.yaml
```

### Notes:  
We used the default setup from the quickstart wuth few  modifications. We exposed our Elastic and Kibana services via node-port  disabled `mlock` 
- Node Port 
https://www.elastic.co/guide/en/cloud-on-k8s/master/k8s-services.html#k8s-allow-public-access

- Mlock
https://www.elastic.co/guide/en/cloud-on-k8s/master/k8s-virtual-memory.html
To check the status in dev console run 
```shell
GET _nodes?filter_path=**.mlockall,**.node.name&format=yaml
```
Should return `true` for each node.

  
- Check and Start Trial in Dev Console if needed 
```shell
GET _license/trial_status
POST _license/start_trial?acknowledge=true
```
Retrieve your `elasticsarch` password
```shell
kubectl get secret quickstart-es-elastic-user -o go-template='{{.data.elastic | base64decode }}'
```

Retrieve your Kibana and Elasticsearch endpoint urls.

```shell
minikube service  quickstart-kb-http  --url --namespace elk
minikube service  quickstart-es-http  --url --namespace elk 
``` 


### Next

[README_MODEL_UPLOAD.md](README_MODEL_UPLOAD.md)

and after that 

[README_INF_PIPELINE.md](README_INF_PIPELINE.md)