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

async function openPopUp() {
    document.querySelector(".popup").classList.toggle("show");
};

async function loadPres(e) {
    let name = e.childNodes[1].childNodes[1].innerText.toString();
    let loc = encodeURI(window.location.origin.toString() + ('/account/presentations/view?name=' + name).toString());

    window.location.href = loc;
};

document.addEventListener('DOMContentLoaded', async () => {
    let filterInput = document.querySelector('select[id*="filter-input"]');

    filterInput.addEventListener('change', async (e) => {
        await fetch('/account/presentations/filter', {
            method: 'POST',
            body: JSON.stringify({
                value: e.target.value.toString(),
            }),
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(res => res.text()).then(async(data) => {
            let presGrid = document.getElementById('pres-grid');
            let cleanedData = await sanitizeJSON(JSON.parse(data));
            let bigString = ``;

            presGrid.innerHTML = '';

            Object.entries(cleanedData).forEach((e) => {
                e = e[1];
                bigString += `<div class="u-container-style u-custom-color-17 u-list-item u-radius-5 u-repeater-item u-shape-round u-list-item-1" onclick="loadPres(this)">
                <div class="u-container-layout u-similar-container u-valign-top u-container-layout-4">
                  <h3 class="u-custom-font u-text u-text-custom-color-8 u-text-default u-text-2">${e.title}</h3>
                  <img class="u-image u-image-round u-preserve-proportions u-radius-5 u-image-1" src="${e.image}" alt="" data-image-width="100" data-image-height="100">
                </div>
              </div>`
            });

            presGrid.innerHTML = bigString;
        }).catch((err) => {
            console.log(err);
            document.getElementById('error-title').innerText = err.toString();
        });
    });
});