function sanitizeJSON(json) {

    const sanitized = {};

    for (const [key, value] of Object.entries(json)) {
        if (typeof value === 'string') {
            sanitized[key] = DOMPurify.sanitize(value);
        } else if (typeof value === 'object') {
            sanitized[key] = sanitizeJSON(value);
        } else {
            sanitized[key] = value;
        };
    };

    return sanitized;
};

async function openPopup(type) {
    let popup = document.getElementById("popup");

    if (type.toString() === 'open') {
        popup.style.display = 'block';
    } else if (type.toString() ==='close') {
        popup.style.display = 'none';
    };
};

document.addEventListener('DOMContentLoaded', async () => {

    document.querySelectorAll('div[id*="slide-down"]').forEach((e) => {
        let splittedId = e.id.toString().split(' ');

        e.addEventListener('click', async () => {
            let slideUp = document.querySelectorAll(`div[id*=${splittedId[1].toString()}]`)[0];
            let activeSlide = document.querySelector('div[class*="u-active"]');

            activeSlide.classList.remove("u-active");
            slideUp.classList.add("u-active");
        });
    });

    document.getElementById('export-btn').addEventListener('click', async () => {
        openPopup('open');
    });

    document.getElementById('close-btn').addEventListener('click', async () => {
        openPopup('close');
    });
});

let isGetting = false;

async function exportPres(type) {
    let nameH2 = document.getElementById('pres-name');
    let errorP = document.getElementById('export-btn');
    let csrfToken = document.querySelector('input[name="csrf_token"]').value;

    console.log('Debug');

    if (isGetting) {
        errorP.innerText = 'Please wait we are exporting your file/files.';
    } else {
        if (nameH2.innerText) {

            isGetting = true;
    
            let exportPre = await fetch('/account/presentations/export', {
                method: 'POST',
                body: JSON.stringify({
                    type: type,
                    name: nameH2.innerText,
                    csrf_token: csrfToken,
                }),
                keepalive: true,
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'Content-Type': 'application/json',
                },
            }).then(res => res.arrayBuffer()).then(buffer => {
                
                isGetting = false;
    
                let blob = new Blob([buffer], {
                    type: 'application/zip',
                });
    
                let fileUrl = URL.createObjectURL(blob);
    
                let linkA = document.createElement('a');
                linkA.href = fileUrl;
    
                if (type.toString() === 'pptx') {
                    linkA.download = (nameH2.innerText + '.pptx').toString();
                } else if (type.toString() === 'image') {
                    linkA.download = (nameH2.innerText + '.zip').toString();
                } else if (type.toString() === 'pdf') {
                    linkA.download = (nameH2.innerText + '.pdf').toString();
                };
    
                document.body.appendChild(linkA);
                linkA.click();
    
                URL.revokeObjectURL(fileUrl);
            }).catch(err => {
                console.log(err);
                if (err) errorP.innerText = 'Error while trying to export presentation.';
            });
        } else {
            errorP.innerText = 'Error while trying to export presentation.';
        };
    };
};