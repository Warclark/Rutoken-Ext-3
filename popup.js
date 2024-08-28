document.addEventListener('DOMContentLoaded', function() {
    const initialContent = document.getElementById('initial-content');



 

    document.getElementById('openWebpageButton').addEventListener('click', function() {
        
            
        chrome.tabs.create({url: 'https://warclark.github.io/demo-page/'});

    });

    document.getElementById('useExtensionOnlyButton').addEventListener('click', function() {

        
        chrome.windows.create({
            url: 'https://warclark.github.io/extpag/',
            type: 'popup',
            width: 425,
            height: 600,
            focused: true
        });
    
    });
    
    




  
});