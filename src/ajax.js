//Downloading the file from a custom url
function downloadFile(url, callbackRef){
    const xhr = new XMLHttpRequest();
    xhr.onerror = (e) => console.log("error");

    xhr.onload = (e) => {
        const jsonString = e.target.response;
        callbackRef(jsonString);
    };

    xhr.open("GET", url);

    xhr.send();
}

export {downloadFile};