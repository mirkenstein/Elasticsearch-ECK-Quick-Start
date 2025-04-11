# Create Inference Pipeline

### Local Models

```shell
## Inference Pipeline
DELETE _ingest/pipeline/text-classification 
PUT _ingest/pipeline/text-classification
{
  "description": "Text Topic and Sentiment pipeline",
  "processors": [
    {
      "inference": {
        "model_id": "typeform__distilbert-base-uncased-mnli",
        "target_field": "text_class",
        "field_map": {
          "text": "text_field"
        },
        "inference_config": {
          "zero_shot_classification": {
            "labels": [
              "Support",
              "Interface",
              "Login and Signup",
              "Experience",
              "Utility"
            ]
          }
        }
      }
    },
    {
      "inference": {
        "model_id": "distilbert__distilbert-base-uncased-finetuned-sst-2-english",
        "target_field": "text_sentiment",
        "inference_config": {
          "text_classification": {}
        },
        "field_map": {
          "text": "text_field"
        }
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
Try the pipeline
```shell
## Simulate Test Pipeline
POST _ingest/pipeline/text-classification/_simulate
{
  "docs": [
    {
      "_source": {
        "text":  "I love the food."
      }
    }
  ]
}
```

### Reindex using the pipeline

```shell
POST _reindex?wait_for_completion=false
{
  "source": {
    "index": "ux-dh-postprocess",
     "_source": ["text","appId","appName","date","categories"],
    "query": {
      "term": {
        "appId.keyword": "com.anthem.sydney"
      }
    }
  },
  "dest": {
    "index": "dest-sentiment-piptest",
    "pipeline": "text-classification"
  }
}
```