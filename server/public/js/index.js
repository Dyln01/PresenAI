document.addEventListener('DOMContentLoaded', async () => {
    let reportForm = document.getElementById('report-form');
    let errorP = document.getElementById('error-p');

    reportForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        let csrfToken = document.querySelector('input[name="csrf_token"').value;

        let formData = new FormData(reportForm);
        let formDataJson = {};

        
        Array.from(formData.entries()).forEach(([key, value]) => {
            formDataJson[key] = value;
        });

        await fetch('/report', {
            method: 'POST',
            body: JSON.stringify(formDataJson),
            headers: {
                'X-CSRF-Token': csrfToken,
                'Content-Type': 'application/json',
            },
            keepalive: true,
        }).then(res => res.text()).then((data) => {
            if (!data.toString().toLowerCase() === 'err') {
                errorP.style.setProperty('color', '#467fa2', 'important');
                errorP.innerText = 'Your report was send and you will get a email soon as possible.';
            } else {
                errorP.innerText = data.toString();
            }
        }).catch((err) => {
            errorP.innerText = 'Unknow error while sending report.';
        });
    });
});