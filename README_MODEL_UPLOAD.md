Load Transformer Models to elastic 
1.  Retrieve your Elasticsearch URLs
```shell
es_http=$(minikube service  quickstart-es-http  --url --namespace elk )
es_url=https${es_http#http} 
es_pass=$(kubectl get secret quickstart-es-elastic-user -o go-template='{{.data.elastic | base64decode }}' --namespace elk)
```


2. Eland Import Models
We will use the eland client utility from elastic to load models into our cluster.
https://www.elastic.co/guide/en/machine-learning/current/ml-nlp-import-model.html


See this blogpost for detailed step by step on the process https://www.elastic.co/guide/en/machine-learning/current/ml-nlp-text-emb-vector-search-example.html

###  Zero Shot Classification
We will use [typeform/distilbert-base-uncased-mnli](https://huggingface.co/typeform/distilbert-base-uncased-mnli)
```shell
model_id="typeform/distilbert-base-uncased-mnli"
task_type="zero_shot_classification"

eland_import_hub_model \
--url $es_url \
-u elastic -p $es_pass \
--hub-model-id $model_id \
--task-type $task_type \
--insecure  
```         

### Sentiment Analysis
```shell
model_id="distilbert/distilbert-base-uncased-finetuned-sst-2-english"
task_type="text_classification"

eland_import_hub_model \
--url $es_url \
-u elastic -p $es_pass \
--hub-model-id $model_id \
--task-type $task_type \
--insecure  
```

3. Start the models.
From the DEV console run the commands documented in
[deploy_model.console](./kibana_console/deploy_model.console)

Check deployed models:
```shell
GET _ml/trained_models/_all/_stats?filter_path=**.model_id,**.deployment_id&format=yaml
```
Start a model
```shell
# typeform__distilbert-base-uncased-mnli
# distilbert__distilbert-base-uncased-finetuned-sst-2-english
POST _ml/trained_models/distilbert__distilbert-base-uncased-finetuned-sst-2-english/deployment/_start
{
  "number_of_allocations":1,
    "adaptive_allocations": {
    "enabled": false

  }
}
```

Navigate to Kibana Analytics Menu->Machine Learning https://192.168.49.2:30885/app/ml/overview

Then go to Trained Models.
Go to our 

# Check available models
```shell
GET _cat/ml/trained_models?v
#
#id                                               heap_size operations create_time              type       ingest.pipelines data_frame.id
#lang_ident_model_1                               1mb       39629      2019-12-05T12:28:34.594Z lang_ident 0                __none__
#sentence-transformers__msmarco-minilm-l12-cos-v5 0b        0          2025-02-22T19:25:58.863Z pytorch    0                __none__
```
Or this one 
```shell
GET _ml/trained_models/_all/_stats
GET _ml/trained_models/_all/_stats?filter_path=**.model_id,**.deployment_id&format=yaml
```
# Start the downloaded model
```shell
POST _ml/trained_models/sentence-transformers__msmarco-minilm-l12-cos-v5/deployment/_start
{
  "number_of_allocations": 3
}
```

### Test deployed Models
```shell
POST _ml/trained_models/sentence-transformers__msmarco-minilm-l12-cos-v5/_infer
{
  "docs": {
    "text_field": "How is the wheather in Jamaica?"
  }
}
```
# Other models
```shell
eland_import_hub_model \
--url es_url \
-u elastic -p $es_pass \
--hub-model-id BAAI/bge-large-en-v1.5 \
--task-type text_embedding \
--insecure

eland_import_hub_model \
--url es_url \
-u elastic -p $es_pass \
--hub-model-id BAAI/bge-large-en-v1.5 \
--task-type text_embedding \
--insecure \
--quantize \
--es-model-id baai__bge-large-en-v1.5_quantized 
```
 
### Note on eland
Supports the following `--task-type` 
- ner
- question_answering
- zero_shot_classification
- text_embedding
- text_classification
- text_similarity
- pass_through
- text_expansion
- fill_mask

For partial list of supported models see here:
[Compatible third party NLP models](https://www.elastic.co/guide/en/machine-learning/current/ml-nlp-model-ref.html)


```shell
 eland_import_hub_model --help
usage: eland_import_hub_model [-h] (--url URL | --cloud-id CLOUD_ID) --hub-model-id HUB_MODEL_ID [--hub-access-token HUB_ACCESS_TOKEN] [--es-model-id ES_MODEL_ID] [-u ES_USERNAME] [-p ES_PASSWORD] [--es-api-key ES_API_KEY]
                              [--task-type {ner,question_answering,zero_shot_classification,text_embedding,text_classification,text_similarity,pass_through,text_expansion,fill_mask}] [--quantize] [--start] [--clear-previous] [--insecure] [--ca-certs CA_CERTS] [--ingest-prefix INGEST_PREFIX]
                              [--search-prefix SEARCH_PREFIX] [--max-model-input-length MAX_MODEL_INPUT_LENGTH]

options:
  -h, --help            show this help message and exit
  --url URL             An Elasticsearch connection URL, e.g. http://localhost:9200
  --cloud-id CLOUD_ID   Cloud ID as found in the 'Manage Deployment' page of an Elastic Cloud deployment
  --hub-model-id HUB_MODEL_ID
                        The model ID in the Hugging Face model hub, e.g. dbmdz/bert-large-cased-finetuned-conll03-english
  --hub-access-token HUB_ACCESS_TOKEN
                        The Hugging Face access token, needed to access private models
  --es-model-id ES_MODEL_ID
                        The model ID to use in Elasticsearch, e.g. bert-large-cased-finetuned-conll03-english.When left unspecified, this will be auto-created from the `hub-id`
  -u ES_USERNAME, --es-username ES_USERNAME
                        Username for Elasticsearch
  -p ES_PASSWORD, --es-password ES_PASSWORD
                        Password for the Elasticsearch user specified with -u/--username
  --es-api-key ES_API_KEY
                        API key for Elasticsearch
  --task-type {ner,question_answering,zero_shot_classification,text_embedding,text_classification,text_similarity,pass_through,text_expansion,fill_mask}
                        The task type for the model usage. Will attempt to auto-detect task type for the model if not provided. Default: auto
  --quantize            Quantize the model before uploading. Default: False
  --start               Start the model deployment after uploading. Default: False
  --clear-previous      Should the model previously stored with `es-model-id` be deleted
  --insecure            Do not verify SSL certificates
  --ca-certs CA_CERTS   Path to CA bundle
  --ingest-prefix INGEST_PREFIX
                        String to prepend to model input at ingest
  --search-prefix SEARCH_PREFIX
                        String to prepend to model input at search
  --max-model-input-length MAX_MODEL_INPUT_LENGTH
                        Set the model's max input length. Usually the max input length is derived from the Hugging Face model confifguation. Use this option to explicity set the model's max input length if the value can not be found in the Hugging Face configuration. Max input length should never exceed the
                        model's true max length, setting a smaller max length is valid.

```
 
 
