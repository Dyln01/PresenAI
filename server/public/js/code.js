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

function isValidUrl(urlString) {
    try {
      new URL(urlString);
      return true;
    } catch (error) {
      return false;
    }
  }

document.addEventListener('DOMContentLoaded', async () => {
    let isCreating = false;
    let presErrorP = document.getElementById('pres-error');
    let inputErrorP = document.getElementById('input-error');
    let redColor = '#e81010';
    let isLoaded = '{{pres-loaded}}';
    let pptx_level = document.querySelector('input[id*="pptx_level"]');

    pptx_level.value = 0;

    inputErrorP.style.fontSize = '16px';

    presErrorP.style.display = 'none';
    inputErrorP.style.display = 'none';

    if (isLoaded === 'true') {
        if (localStorage.getItem('pres-loading')) {
            localStorage.removeItem('pres-loading');
        };
    };

    document.querySelector('[name*="pptx_name"]').addEventListener('input', (e) => {
        let name_val = e.target.value;

        console.log(name_val);

        if (name_val) {
            if (name_val.includes('-')) {
                document.getElementById('input-error').innerText = 'Presentation name cannot include "-".';
                inputErrorP.style.display = 'block';
            };
        };
    });

    document.getElementById('pptx-form').addEventListener('submit', async (e) => {

        e.preventDefault();

        if (isCreating) {
            document.getElementById('input-error').innerText = 'Already creating a presentation.';
            inputErrorP.style.display = 'block';
        } else {
            let name_val = document.querySelector('input[id*="pptx_name"]').value;
            let lang_val = document.querySelector('input[id*="pptx_lang"]').value;
            let max_slides_val = document.querySelector('input[id*="max_slides"]').value;
            let content_slide_val = document.querySelector('input[id*="content_slide"]').checked;
            let end_slide_val = document.querySelector('input[id*="end_slide"]').checked;
            let pptx_level_val = pptx_level.value;
            let csrfToken = document.querySelector('input[name="csrf_token"]').value;

            if (name_val) {
                if (name_val.includes('-')) {
                    document.getElementById('input-error').innerText = 'Presentation name cannot include "-".';
                    inputErrorP.style.display = 'block';
                } else {
    
                    let json = JSON.stringify({
                        name: name_val,
                        lang: lang_val,
                        max_slides: max_slides_val,
                        pptx_level: pptx_level_val,
                        content_slide: content_slide_val,
                        end_slide: end_slide_val,
                        csrf_token: csrfToken,
                    })
    
                    isCreating = true;
        
                    localStorage.setItem('pres-loading', 'loading'); 

                    await fetch('/account/get-queue/pptx', {
                        method: 'GET',
                    }).then((res) => res.text()).then((data) => {

                        console.log(data);

                        inputErrorP.style.display = 'block';
                        inputErrorP.style.setProperty('color', '#467fa2', 'important');
                        inputErrorP.innerText = `Loading...\n The presentation is made in about 1 to 2 minutes.\n There are ${data.toString()} people before you.`;

                    }).catch((err) => {
                        inputErrorP.innerText = 'Unknow error while getting queue length. \n Presentation will still be made.';
                    });

                    let create = await fetch('/account/presentation', {
                        method: 'POST',
                        body: json,
                        keepalive: true,
                        headers: {
                            'X-CSRF-Token': csrfToken,
                            'Content-Type': 'application/json',
                        },
                    }).then((res) => {

                        res.text().then((data) => {
                            inputErrorP.style.setProperty('color', redColor, 'important');
                            isCreating = false;
    
                            if (res.status === 403) {
                                inputErrorP.innerText = data.toString();
                            } else {
                                if (data.toString() === 'created_pres') {
                                    inputErrorP.style.setProperty('color', '#467fa2', 'important');
        
                                    inputErrorP.innerText = 'You can now go to the Presentations page and view your presentation. \n If the presentation doesnt exist then try to create one later.';
                                } else if(data.toString() === 'not_enough') {
                                    inputErrorP.innerHTML = 'Not enough presentations left. <a href="/account/settings">Buy more presentations to create more presentations</a>';
                                }
                                 else {
                                    inputErrorP.innerText = 'You can now wait for the presentation to be made.\n Go to the Presentations page in about 1 to 2 minutes. \n If the presentation doesnt exist then try to create one later.';
                                };
                            };
                        });
                    }).catch((err) => {
                        inputErrorP.innerText = err.message.toString();
                    });
                };
            };
        };
    });

    document.querySelector('input[id*="pres-search-input"]').addEventListener('blur', async (e) => {
        search(e);
    });

    document.querySelector('input[id*="pres-search-input"]').addEventListener('keydown', async (e) => {
        if (e.key.toLowerCase() === 'enter') {
            search(e);
        };
    });

    async function search(e) {

        let csrfToken = document.querySelector('input[name="csrf_token_search"]').value;

        if (e.target.value.length > 2) {
            let json = JSON.stringify({
                name: e.target.value,
                csrf_token: csrfToken,
            });

            let result = await fetch('/account/presentations/search', {
                method: 'POST',
                body: json,
                keepalive: true,
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'Content-Type': 'application/json',
                },
            }).then(res => res.text()).then(async res => {
                let sanitzedData = await sanitizeJSON(JSON.parse(res));

                console.log(Object.entries(sanitzedData).length);

                if (Object.entries(sanitzedData).length > 0) {

                    if (!Object.entries(sanitzedData)[0][1].title) {
                        presErrorP.innerText = 'Error while trying to get presentations. Please try again.';
                    } else if (Object.entries(sanitzedData).length >= 3 && sanitzedData) {
                        document.getElementById('pres-grid').innerHTML = ` 
                        <div id="pres-item-btn" class="u-align-center-md u-align-center-sm u-align-center-xs u-container-style u-custom-color-17 u-expanded-width-lg u-expanded-width-md u-group u-radius-5 u-shape-round u-group-3">
                        <div class="u-container-layout u-container-layout-5">
                          <h3 class="u-custom-font u-text u-text-custom-color-8 u-text-default u-text-3">${Object.entries(sanitzedData)[0][1].title}</h3>
                          <img class="u-image u-image-default u-preserve-proportions u-image-1" src="${Object.entries(sanitzedData)[0][1].image}" alt="" data-image-width="100" data-image-height="100">
                        </div>
                      </div>
                      <div id="pres-item-btn" class="u-align-center-md u-align-center-sm u-align-center-xs u-container-style u-custom-color-17 u-expanded-width-lg u-expanded-width-md u-expanded-width-xl u-expanded-width-xxl u-group u-radius-5 u-shape-round u-group-4">
                        <div class="u-container-layout u-container-layout-6">
                          <h3 class="u-custom-font u-text u-text-custom-color-8 u-text-default u-text-4">${Object.entries(sanitzedData)[1][1].title}</h3>
                          <img class="u-image u-image-default u-preserve-proportions u-image-2" src="${Object.entries(sanitzedData)[1][1].image}" alt="" data-image-width="100" data-image-height="100">
                        </div>
                      </div>
                      <div id="pres-item-btn" class="u-align-center-md u-align-center-sm u-align-center-xs u-container-style u-custom-color-17 u-expanded-width-lg u-expanded-width-md u-expanded-width-xl u-expanded-width-xxl u-group u-radius-5 u-shape-round u-group-5">
                        <div class="u-container-layout u-container-layout-7">
                          <h3 class="u-custom-font u-text u-text-custom-color-8 u-text-default u-text-5">${Object.entries(sanitzedData)[2][1].title}n</h3>
                          <img class="u-image u-image-default u-preserve-proportions u-image-3" src="${Object.entries(sanitzedData)[2][1].image}" alt="" data-image-width="100" data-image-height="100">
                        </div>
                      </div>`;

                        document.getElementById('pres-grid').style.display = 'block';

                        document.querySelectorAll('#pres-item-btn').forEach((el) => {
                            el.addEventListener('click', async (e) => {
                                let inn = e.target.parentElement.firstElementChild.innerText;

                                if (typeof inn === 'string' && inn) {

                                    window.location = encodeURI(`/account/presentations/view?name=${inn}`);

                                };
                            });
                        });

                    } else if (Object.entries(sanitzedData).length >= 2 && sanitzedData) {
                        document.getElementById('pres-grid').innerHTML = ` 
                        <div id="pres-item-btn" class="u-align-center-md u-align-center-sm u-align-center-xs u-container-style u-custom-color-17 u-expanded-width-lg u-expanded-width-md u-group u-radius-5 u-shape-round u-group-3">
                        <div class="u-container-layout u-container-layout-5">
                          <h3 class="u-custom-font u-text u-text-custom-color-8 u-text-default u-text-3">${Object.entries(sanitzedData)[0][1].title}</h3>
                          <img class="u-image u-image-default u-preserve-proportions u-image-1" src="${Object.entries(sanitzedData)[0][1].image}" alt="" data-image-width="100" data-image-height="100">
                        </div>
                      </div>
                      <div id="pres-item-btn" class="u-align-center-md u-align-center-sm u-align-center-xs u-container-style u-custom-color-17 u-expanded-width-lg u-expanded-width-md u-expanded-width-xl u-expanded-width-xxl u-group u-radius-5 u-shape-round u-group-4">
                        <div class="u-container-layout u-container-layout-6">
                          <h3 class="u-custom-font u-text u-text-custom-color-8 u-text-default u-text-4">${Object.entries(sanitzedData)[1][1].title}</h3>
                          <img class="u-image u-image-default u-preserve-proportions u-image-2" src="${Object.entries(sanitzedData)[1][1].image}" alt="" data-image-width="100" data-image-height="100">
                        </div>
                      </div>`;

                        document.getElementById('pres-grid').style.display = 'block';

                        document.querySelectorAll('#pres-item-btn').forEach((el) => {
                            el.addEventListener('click', async (e) => {
                                let inn = e.target.parentElement.firstElementChild.innerText;

                                if (typeof inn === 'string' && inn) {

                                    window.location = encodeURI(`/account/presentations/view?name=${inn}`);

                                };
                            });
                        });
                    } else if (Object.entries(sanitzedData).length >= 1 && typeof Object.entries(sanitzedData)[0][1].title !== 'undefinded' && sanitzedData) {
                        document.getElementById('pres-grid').innerHTML = ` 
                        <div id="pres-item-btn" class="u-align-center-md u-align-center-sm u-align-center-xs u-container-style u-custom-color-17 u-expanded-width-lg u-expanded-width-md u-group u-radius-5 u-shape-round u-group-3">
                        <div class="u-container-layout u-container-layout-5">
                          <h3 class="u-custom-font u-text u-text-custom-color-8 u-text-default u-text-3">${Object.entries(sanitzedData)[0][1].title}</h3>
                          <img class="u-image u-image-default u-preserve-proportions u-image-1" src="${Object.entries(sanitzedData)[0][1].image}" alt="" data-image-width="100" data-image-height="100">
                        </div>
                      </div>`;

                        document.getElementById('pres-grid').style.display = 'block';

                        document.querySelectorAll('#pres-item-btn').forEach((el) => {
                            el.addEventListener('click', async (e) => {
                                let inn = e.target.parentElement.firstElementChild.innerText;

                                if (typeof inn === 'string' && inn) {

                                    window.location = encodeURI(`/account/presentations/view?name=${inn}`);

                                };
                            });
                        });
                    } else {
                        presErrorP.innerText = 'Error while trying to get presentations. Please try again.';
                    };
                } else {
                    presErrorP.innerText = 'Error while trying to get presentations. Please try again.';
                };
            });
        } else {
            presErrorP.innerText = 'Input length must be 3 characters long.';
        };
    };
});