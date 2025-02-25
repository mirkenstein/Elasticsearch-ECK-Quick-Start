import asyncio
from app_store_scraper import AppStore
from elasticsearch import Elasticsearch, AsyncElasticsearch
from elasticsearch.exceptions import NotFoundError
import ssl
index_name = 'llm-app-store-search'

# Elasticsearch setup
context = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
# context.check_hostname = False
context.verify_mode = ssl.CERT_NONE

es = Elasticsearch([{'host': '192.168.49.2', 'port': 32357,'scheme': 'https'}], ssl_context=context)


def check_indices(client):
    try:
        if client.indices.exists(index=index_name):
            print('index already exists')
        else:
            client.indices.create(index=index_name)
    except Exception as err:
        print("Error while checking indices: ", err)


# Async function to bulk push the data into Elasticsearch
async def run(client, dataset):
    print(dataset[0]["developerResponse"])
    data_body = [
        {"index": {"_index": index_name}}
        for data in dataset
    ]

    async with AsyncElasticsearch(
            [{'host': '192.168.49.2', 'port': 32357, 'use_ssl': True}]
    ) as client:
        responses = await client.bulk(body=data_body, refresh="wait_for")
        if responses["errors"]:
            print("errors in bulk push: ", responses["errors"])

        count = await client.count(index=index_name)
        print(count)


# function to scrape reviews and push into ES
def scrape_reviews(app_id='1463423283', num_pages=200):
    prom_labs = AppStore(country="us", app_name="prom-labs", app_id=app_id)
    prom_labs.review(how_many=num_pages)

    if prom_labs.reviews:  # If we have any reviews
        print("Number of reviews: ", len(prom_labs.reviews))
        check_indices(es)
        asyncio.run(run(es, prom_labs.reviews))


scrape_reviews()