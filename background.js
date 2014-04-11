function openMainPage() {
    chrome.tabs.create(
        {
            'url':'./mainpage.html',
            'selected':true
        });
}

chrome.browserAction.onClicked.addListener(openMainPage);
