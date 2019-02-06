var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.get('/', function(req, res){
	res.render('index');
});

app.post('/add', bodyParser.json(), function(req, res){
	var a = req.body.a;
	var b = req.body.b;
	var sum = a + b;

	res.json(sum); 
});

app.use(express.static(path.resolve(__dirname, 'public')));

app.listen(process.env.PORT || 1337);

var connectionString = "DefaultEndpointsProtocol=https;AccountName=chazestorage;AccountKey=DwW+/PUZTVGYWFhoP2F1LUKorUgNh4Sp3BW/E831kS6AvnzCpzGh5DLKXD4wnrgQQDtAYeL0hy7oLVJTtKOYKA==;EndpointSuffix=core.windows.net";

//Azure
const {
    Aborter,
    BlockBlobURL,
    ContainerURL,
    ServiceURL,
    SharedKeyCredential,
    StorageURL,
    uploadStreamToBlockBlob,
    uploadFileToBlockBlob
} = require('@azure/storage-blob');

const storage = require('azure-storage');
const blobService = storage.createBlobService(connectionString);


const fs = require('fs');

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const STORAGE_ACCOUNT_NAME = "chazestorage";
const ACCOUNT_ACCESS_KEY = "DwW+/PUZTVGYWFhoP2F1LUKorUgNh4Sp3BW/E831kS6AvnzCpzGh5DLKXD4wnrgQQDtAYeL0hy7oLVJTtKOYKA==";

const ONE_MEGABYTE = 1024 * 1024;
const FOUR_MEGABYTES = 4 * ONE_MEGABYTE;
const ONE_MINUTE = 60 * 1000;

async function showContainerNames(aborter, serviceURL) {

    let response;
    let marker;

    do {
        response = await serviceURL.listContainersSegment(aborter, marker);
        marker = response.marker;
        for(let container of response.containerItems) {
            console.log(` - ${ container.name }`);
        }
    } while (marker);
}

async function showBlobNames(aborter, containerURL) {

    let response;
    let marker;

    do {
        response = await containerURL.listBlobFlatSegment(aborter);
        marker = response.marker;
        for(let blob of response.segment.blobItems) {
            console.log(` - ${ blob.name }`);
        }
    } while (marker);
}

const downloadBlob = async (containerName, blobName) => {
    const dowloadFilePath = path.resolve(path.resolve(__dirname) + "/" + blobName);
    console.log(dowloadFilePath);
    return new Promise((resolve, reject) => {
        blobService.getBlobToText(containerName, blobName, (err, data) => {
            if (err) {
                reject(err);
                console.log(err);
            } else {
            	//Display the data in the console
                console.log(`${data}`);
            }
        });
    });
};

async function execute() {

    const containerName = "trainings";
    const blobName = "short.txt";

    const credentials = new SharedKeyCredential(STORAGE_ACCOUNT_NAME, ACCOUNT_ACCESS_KEY);
    const pipeline = StorageURL.newPipeline(credentials);
    const serviceURL = new ServiceURL(`https://chazestorage.blob.core.windows.net`, pipeline);
    
    const containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);
    const blockBlobURL = BlockBlobURL.fromContainerURL(containerURL, blobName);
    
    const aborter = Aborter.timeout(30 * ONE_MINUTE);

    console.log("Containers:");
    await showContainerNames(aborter, serviceURL);

    console.log(`Blobs in "${containerName}" container:`);
    await showBlobNames(aborter, containerURL);

    await downloadBlob(containerName, blobName);

}

execute().then(() => console.log("Done")).catch((e) => console.log(e));