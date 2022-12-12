import { BlobServiceClient } from "@azure/storage-blob";

// Update <placeholder> with your Blob service SAS URL and Container Name string
const blobSasUrl = "<placeholder>";
const containerName = "audio";

const startRecordingButton = document.getElementById("start-recording-button");
const stopRecordingButton = document.getElementById("stop-recording-button");
const status = document.getElementById("status");

const reportStatus = message => {
    status.innerHTML += `${message}<br/>`;
    status.scrollTop = status.scrollHeight;
}

// Create a new BlobServiceClient
const blobServiceClient = new BlobServiceClient(blobSasUrl);
const containerClient = blobServiceClient.getContainerClient(containerName);

const startRecording = async () => {
    try {
        reportStatus(`Start Recording...`);
        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = false;

        //ブラウザでマイクへのアクセス権を取得する
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        navigator.getUserMedia({
            audio: true,
            video: false
        }, successFunc, errorFunc);
    } catch (error) {
        reportStatus(error.message);
    }
};

let recorder = null;

function successFunc(stream) {
    recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
    });

    var chunks = [];
    //集音のイベントを登録する
    recorder.addEventListener('dataavailable', function(ele) {
        if (ele.data.size > 0) {
            chunks.push(ele.data);
        }
    });

    // recorder.stopが実行された時のイベント
    recorder.addEventListener('stop', function() {        
        // 日付時刻を .wav ファイル名に指定
        var blob_bname = new Date() + ".wav";

        // Upload wav data to Azure Blob Storage
        reportStatus(`Uploading file to Azure Blob Storage...`);
        reportStatus(blob_bname);
        const promises = [];
        const blockBlobClient = containerClient.getBlockBlobClient(blob_bname);
        promises.push(blockBlobClient.uploadBrowserData(new Blob(chunks)));
        reportStatus(`Done.`);
    });

    recorder.start();
}

const stopRecording = async () => {
    try {
        reportStatus(`Stop Recording...`);
        stopRecordingButton.disabled = true;
        startRecordingButton.disabled = false;
        recorder.stop();
    } catch (error) {
        reportStatus(error.message);
    }
};

function errorFunc(error) {
    alert("error");
}

startRecordingButton.addEventListener("click", startRecording);
stopRecordingButton.addEventListener("click", stopRecording);
