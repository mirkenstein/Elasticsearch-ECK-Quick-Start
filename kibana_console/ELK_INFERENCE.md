# Semantic Text Fields and Inference Endpoints

[Inference APIs](https://www.elastic.co/guide/en/elasticsearch/reference/current/inference-apis.html)
An inference endpoint enables you to use the corresponding machine learning model without manual deployment and apply it to your 
data at ingestion time through [semantic text](https://www.elastic.co/guide/en/elasticsearch/reference/current/semantic-text.html).


1. Create Inference Endpoint pointing to self hosted Huhggingface [TEI](https://github.com/huggingface/text-embeddings-inference) ( Text Embedding Endpoint) 
```shell
PUT _inference/text_embedding/hugging-face-embeddings-gpu
{
  "service": "hugging_face",
  "service_settings": {
    "api_key": """${hf_token}""", 
    "url": "http://"${inference_ip}":8081/embed" 
  }
}
```
2. Create Index with type `semantic_text` 
See the documentation for details. This is not GA. [semantic text](https://www.elastic.co/guide/en/elasticsearch/reference/current/semantic-text.html).
Main features: 
   - 
```shell
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "inference_field": {
        "type": "semantic_text",
        "inference_id": "hugging-face-embeddings-gpu"
      }
    }
  }
}
```

## Use the endpoint in your vector search
```shell
GET collection-with-embeddings/_search
{
  "knn": {
    "field": "text_embedding.predicted_value",
    "query_vector_builder": {
      "text_embedding": {
        "model_id": "hugging-face-embeddings-gpu",
        "model_text": "How is the weather in Jamaica?"
      }
    },
    "k": 10,
    "num_candidates": 100
  },
  "_source": [
    "id",
    "text"
  ]
}
```
##  Test Inference Embedding Endpoint
```shell
GET _inference
POST _inference/text_embedding/hugging-face-embeddings-gpu
{
  "input": "The sky above the port was the color of television tuned to a dead channel."
}
DELETE my-index
PUT /my-index
{
  "mappings": {
    "properties": {
      "text": {
        "type": "semantic_text",
        "inference_id": "hugging-face-embeddings-gpu"
      }
    }
  }
}
POST /my-index/_doc
{ 
  "text": "There are a few foods and food groups that will help to fight inflammation and delayed onset muscle soreness (both things that are inevitable after a long, hard workout) when you incorporate them into your postworkout eats, whether immediately after your run or at a meal later in the day" 
}
POST /my-index/_search
{
  "size" : 3,
  "query" : {
    "semantic": {
      "field": "text", 
      "query": "How to avoid muscle soreness while running?" 
    }
  }
}
```
# Dense Vector Search

[Parameters for dense vector fields](https://www.elastic.co/guide/en/elasticsearch/reference/current/dense-vector.html)

```shell
GET collection-with-embeddings/_search
{
  "knn": {
    "field": "text_embedding.predicted_value",
    "query_vector_builder": {
      "text_embedding": {
        "model_id": "hugging-face-embeddings-gpu",
        "model_text": "How is the weather in Jamaica?"
      }
    },
    "k": 10,
    "num_candidates": 100
  },
  "_source": [
    "id",
    "text"
  ]
}
```

# Sparse Vector Search 
[Sparse Vector Field Type ](https://www.elastic.co/guide/en/elasticsearch/reference/current/sparse-vector.html)


https://www.elastic.co/search-labs/blog/elasticsearch-sparse-vector-query

See also the ELSER code example in  Elastic's [Semantic search](https://www.elastic.co/guide/en/elasticsearch/reference/current/semantic-search.html)
documentation.
```shell
GET collection-with-sparse-embeddings/_search
{
  "query": {
    "sparse_vector": {
      "field": "text_sparse_embedding.predicted_value",
      "inference_id": ".elser_model_2_linux-x86_64",
      "query": "constellations in the northern hemisphere"
    }
  }
}
```

# Dense Vector Search (k-nearest neighbor (kNN) search)
[Parameters for dense vector fields](https://www.elastic.co/guide/en/elasticsearch/reference/current/dense-vector.html)

See [How to deploy a text embedding model and use it for semantic search](https://www.elastic.co/guide/en/machine-learning/current/ml-nlp-text-emb-vector-search-example.html) blogpost for end-to-end example 

 Main documentation page:
[k-nearest neighbor (kNN) search](https://www.elastic.co/guide/en/elasticsearch/reference/current/knn-search.html)

### kNN methods 
Elasticsearch supports two methods for kNN search:

- [Approximate kNN](https://www.elastic.co/guide/en/elasticsearch/reference/current/knn-search.html#approximate-knn) using the knn search option or knn query
- [Exact, brute-force kNN](https://www.elastic.co/guide/en/elasticsearch/reference/current/knn-search.html#exact-knn) using a script_score query with a vector function

> [!NOTE]  
> The default index type for dense_vector is `int8_hnsw`.

 ### Approximate kNN

To run an approximate kNN search, use the 
[knn](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html#search-api-knn) 
option to search one or more dense_vector fields with indexing enabled.


Example query using external inference embedding endpoint.
`model_id` can be either an elastic deployed model or and inference endpoint.
```shell
GET collection-with-embeddings/_search
{
  "knn": {
    "field": "text_embedding.predicted_value",
    "query_vector_builder": {
      "text_embedding": {
        "model_id": "hugging-face-embeddings-gpu",
        "model_text": "How is the weather in Jamaica?"
      }
    },
    "k": 10,
    "num_candidates": 100
  },
  "_source": [
    "id",
    "text"
  ]
}
```
Use either `query_vector` or `query_vector_builder`

# Exact kNN 
To run an [exact kNN](https://www.elastic.co/guide/en/elasticsearch/reference/current/knn-search.html#exact-knn) search, 
use a `script_score` query with a vector function.
Sample query:
```shell
POST product-index/_search
{
  "query": {
    "script_score": {
      "query" : {
        "bool" : {
          "filter" : {
            "range" : {
              "price" : {
                "gte": 1000
              }
            }
          }
        }
      },
      "script": {
        "source": "cosineSimilarity(params.queryVector, 'product-vector') + 1.0",
        "params": {
          "queryVector": [-0.5, 90.0, -10, 14.8, -156.0]
        }
      }
    }
  }
}
```




 