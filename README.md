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
        "model_id": " LLAMA ID"
        "url":"${MY_LOCAL_OPEN_AI_COMLPETION_URL}"
    }
}
```
Example  MY_LOCAL_OPEN_AI_COMLPETION_URL value "http://10.1.1.5:8080/v1/chat/completions"
Google AI Services  and other Inference Integrations.
```shell
PUT _inference/completion/openai-completion-gpt-4o-mini
{
    "service": "openai",
    "service_settings": {
        "api_key": "${OPEN_AI_API_KEY}",
        "model_id": "gpt-4o-mini"
    }
}
PUT _inference/completion/openai-completion-gpt-3.5-turbo
{
    "service": "openai",
    "service_settings": {
        "api_key": "${OPEN_AI_API_KEY}",
        "model_id": "gpt-3.5-turbo"
    }
}
DELETE _inference/completion/google_ai_studio_completion
PUT _inference/completion/google_ai_studio_completion
{
    "service": "googleaistudio",
    "service_settings": {
        "api_key": "${GEMINI_API_KEY}",
        "model_id": "gemini-2.0-flash"
    }
}

POST _inference/completion/google_ai_studio_completion
{
  "input": "What is Elastic?"
}
```

### Create Inference Pipeline
We use `gpt4o-mini`
```shell 
PUT _ingest/pipeline/llm-classification
{
  "description": "LLM Text Topic and Sentiment pipeline",
  "processors": [
    {
      "script": {
        "source": "ctx.prompt = 'Please categorize the following text into one of these comma separated single word categories with expanded definition in parenthesis:  UX (App Functionality, App User experience,App usability),UI (User Interface),Reliability (Technical Issues, Performance & Reliability),Login (Login, Sign Up and Account Issues),  Support (Customer Service and Support), Fees(Baggage Policy and Fees), Check-in(Check-in process and or Boarding Process), Service (Flight Experience),Payment (Payment And Billing Issues), Overall ( General sentiment for the entire text).  Provide numeric sentiment score for each if applicable. Output valid JSON string. Keys shoud be single word category and value the sentiment value. If not categories applies do not return that key. Respond with no Markdown, no asterisks, no backticks, and no special formatting—just plain text. If sentiment cannot be determined then provide a simple empty json string. Do not provide any explanation. Return only a valid json : ' + ctx.content"
      }
    },
    {
      "inference": {
   "model_id": "openai-completion-gpt-4o-mini",
          // "model_id": "google_ai_studio_completion",
        "input_output": {
          "input_field": "prompt",
          "output_field": "summary"
        }
      }
    },
    {
      "json": {
        "field": "summary",
        "target_field": "json_target"
      }
    },
    {
      "remove": {
        "field": [
          "prompt",
          "summary"
        ]
      }
    }
  ],
  "on_failure": [
    {
      "set": {
        "description": "Index document to 'failed-<index>'",
        "field": "_index",
        "value": "failed-{{{_index}}}"
      }
    },
    {
      "set": {
        "description": "Set error message",
        "field": "ingest.failure",
        "value": "{{_ingest.on_failure_message}}"
      }
    }
  ]
}

```
Test the pipeline
```shell
POST _ingest/pipeline/llm-classification/_simulate
{
  "docs": [
    {
      "_source": {
        "text":  "Great app with a lot of usefull features. Can't login. No one helped me resolve the login issue"
      }
    }
  ]
}
```

Run few  ETLs for airlines google play store apps
using this node script
https://github.com/mirkenstein/bolt-gplay-scraper.git 

```shell
npm run google com.delta.mobile.android
npm run google com.aa.android
npm run google com.united.mobile.android
npm run google com.southwestairlines.mobile

```