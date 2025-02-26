'use strict'


var store = require('app-store-scraper');
require('dotenv').config();
require('array.prototype.flatmap').shim()
const { Client } = require('@elastic/elasticsearch')
const node = process.env.ELASTICSEARCH_NODE
const client = new Client({
    // node: 'http://localhost:9200'
    node: node,
    tls: {
        // ca: process.env.elasticsearch_certificate,
        rejectUnauthorized: false, // <-- this is important
    },
})



/*
Create index and ingest google store review data
 */
const index_name='llm-app-store-search'

function checkIndices() {
    client.indices.exists({index: index_name}, (err, res, status) => {
        if (res) {
            console.log('index already exists');
        } else {
            client.indices.create( {index: index_name}, (err, res, status) => {
                console.log(err, res, status);
            })
        }
    })
}

async function run (dataset) {
    await client.indices.create({
        index: index_name,
        body: {
            mappings: {
                properties: {

                    // title: { type: 'text' },
                    // description: { type: 'text' },
                    // descriptionHTML: { type: 'text' },
                    // summary: { type: 'text' },
                    // installs: { type: 'text' },
                    // minInstalls: { type: 'number' },
                    // score: { type: 'number' },
                    // scoreText: { type: 'text' },
                    // ratings: { type: 'number' },
                    // reviews: { type: 'number' },
                    // // hisogram: { type: 'number' },
                    // price: { type: 'number' },
                    // free: { type: 'boolean' },
                    // currency: { type: 'text' },
                    // priceText : {type: 'text'},
                    // offersIAP: { type: 'boolean' },
                    // IAPRange: { type: 'text' },
                    // size: { type: 'text' },
                    // androidVersion: { type: 'text' },
                    // androidVersionText: { type: 'text' },
                    // developer: {type: 'text'},
                    // developerId : {type: 'text'},
                    // developerEmail : {type: 'text'},
                    // developerWebsite : {type: 'text'},
                    // developerAddress : {type: 'text'},
                    // privacyPolicy : {type: 'text'},
                    // developerInternalID : {type: 'text'},
                    // genre : {type: 'text'},
                    // genreId : {type: 'text'},
                    // familyGenre : {type: 'text'},
                    // familyGenreId : {type: 'text'},
                    // editorsChoice : {type: 'boolean'},
                    updated : {type: 'date', format: "epoch_millis||yyyy-MM-dd'T'HH:mm:ssXXX"},
                    // released : {type: 'date', format: 'MMM dd, yyyy||MMM d, yyyy'},
                    title: {type: 'text'},
                    id: { type: 'text' },
                    url: {type: 'text'}
                }
            }
        }
    }, { ignore: [400] })


    const body = dataset.flatMap(doc => [{ index: { _index: index_name ,_id: doc.id} }, doc])

    const bulkResponse  = await client.bulk({ refresh: true,pipeline:'llm-classification', body })

    if (bulkResponse.errors) {
        console.log('errors')
        const erroredDocuments = []
        // The items array has the same order of the dataset we just indexed.
        // The presence of the `error` key indicates that the operation
        // that we did for the document has failed.
        bulkResponse.items.forEach((action, i) => {
            const operation = Object.keys(action)[0]
            if (action[operation].error) {
                erroredDocuments.push({
                    // If the status is 429 it means that you can retry the document,
                    // otherwise it's very likely a mapping error, and you should
                    // fix the document before to try it again.
                    status: action[operation].status,
                    error: action[operation].error,
                    operation: body[i * 2],
                    document: body[i * 2 + 1]
                })
            }
        })
        console.log(erroredDocuments)
    }

    const { body: count } = await client.count({ index: index_name })
    console.log('index name '+index_name)
}

// store.reviews({
//     id: '1463423283',
//     sort: store.sort.RECENT,
//     num: 200,
//     page: 1
// }).then(value => {
//     console.log("Number of reviews:"+value.length)
//     // var jsonData=JSON.stringify(value,null,2);
//     run(value).catch(console.log)
//  });

let page = 1;
let hasNextPage = true;

async function fetchReviews() {
    while(hasNextPage  && page <= 10) {
        const value = await store.reviews({
            id: '1463423283',
            sort: store.sort.HELPFUL,
            num: 200,
            page: page
        });

        if(value.length >0) {
            console.log("Number of reviews on page "+ page +": "+ value.length);
            await run(value);
            page++;
        } else {
            hasNextPage = false;
        }
    }
}
fetchReviews().catch(console.log);
// store.list({
//     collection: store.collection.NEW_FREE_IOS,
//     category: store.category.MEDICAL,
//     num: 2
// })
//     .then(console.log)
//     .catch(console.log);

// appstore.similar({appId: "com.healee.healeeApp"}).then(
//     value => {  console.log("Number of reviews:"+value.length)
//         // console.log(value)
//         run(value).catch(console.log)
//     }
//
// );

//
// store.search({
//     term: "Sydney",
//     category: store.category.MEDICAL,
//     // collection: appstore.collection.TRENDING,
//     num: 2,
//     country: 'us'
//     // fullDetail: true
// }).then(
//     value => {  console.log("Number of reviews:"+value.length)
//         // console.log(value)
//         run(value).catch(console.log)
//     }
// );
