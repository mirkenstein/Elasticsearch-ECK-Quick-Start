# Elasticsearch Kubernetes Deployment

Deployment of multinode elasticsearch with [ECK](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-deploy-eck.html). 

### Minikube Setup
[Minikube](https://minikube.sigs.k8s.io/) is most commonly used for local kubernetes deployment.

For details on the minikube setup see [minikube/README.md](minikube/README.md)


### Quickstart Elastic ECK
The deployment provided here is taken from the ECK Quickstart with some minimal modification.
https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-deploy-eck.html



Deploy ECK operator:
```shell
kubectl create -f https://download.elastic.co/downloads/eck/2.16.1/crds.yaml
```
The ECK operator runs in the  `elastic-system` namespace.

We will deploy our cluster in the `elk` namespace

### Setup prerequisites for the ELK cluster

 - Create `elk` namespace and set it as defult.
```shell
kubectl create namespace elk 
kubectl config set-context --current --namespace elk
```
This bash alias might come handy when exporting multiple 
```shell
alias kcontext='kubectl config set-context --current --namespace $1'
```

 - Set these environment variables
```shell
ECK_ES_PASS=<string> 
$S3_ACCESS_KEY=<string>
$S3_SECRET_KEY=<string>
```
 - Set your `elastic`  admin user password in advance

```shell
kubectl create secret generic quickstart-es-elastic-user --from-literal=elastic=$ECK_ES_PASS 
```

 - Start the trial. From inside the [manifests](manifests) directory run:
```shell
kubectl apply -f start-trial.yaml 
```
 - Add S3 bucket credentials which will be used for data snapshot and restore.

```shell
kubectl create secret generic minio-credentials \
--from-literal=s3.client.default.access_key=$S3_ACCESS_KEY \
--from-literal=s3.client.default.secret_key=$S3_SECRET_KEY
```

To retrieve the elasticsearch password from running cluster you can use this 

```shell
kubectl get secret quickstart-es-elastic-user -o go-template='{{.data.elastic | base64decode }}'
```
###  Create Elastic-Kibana Cluster
From inside the [manifests/](manifests) directory.

- Deploy Elasticsearch
```shell
kubectl apply -k overlays/dev/
```
For more details on the kusomization of elasticsearch refer to: [manifests/kustomize/README.md](manifests/kustomize/README.md)

- Deploy Kibana
```shell 
kubectl apply  -f kibana.yaml
```
Note on the kibana configuration. 

For the settings: `  config.server.publicBaseUrl` use the IP to your minikube node IP from `minikube profile list`

Retrieve your Kibana and Elasticsearch endpoint urls.

```shell
minikube service  quickstart-kb-http  --url --namespace elk --profile kustomize
minikube service  quickstart-es-http  --url --namespace elk --profile kustomize
```
Sample output for `quickstart-kb-http`:
```shell
http://192.168.58.2:30601
```
Open the `https` Kibana service URL and at the login screen use the  credentials: `elastic` and `$ECK_ES_PASS` 
https://192.168.58.2:30601

Next Steps:

### Next Steps. WIP. To Refactor
- ToDo Refactor these 
For loading models to elasticsearch
[README_MODEL_UPLOAD.md](to_refactor/README_INF_PIPELINE.md)

Inference setup:

[README_INF_PIPELINE.md](to_refactor/README_INF_PIPELINE.md)


Hugging Face Model Deployment. 
[deploy_model.console](kibana_console/deploy_model.console)


Pipeline using the deployed models for topic and sentiment analysis.
[bert-sentiment.console](to_refactor/kibana_console/bert-sentiment.console)


OpenAI Inference Completion Pipeline with the test
[llm-sentiment.console]((to_refactor/kibana_console/llm-sentiment.console)

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