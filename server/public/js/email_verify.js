document.addEventListener('DOMContentLoaded', async () => {
    let resendBtn = document.getElementById('resend-btn');
    let used = false;

    resendBtn.addEventListener('click', async () => {
        let csrfToken = document.querySelector('input[name="csrf_token"]').value;
        let verifyText = document.getElementById('verify-text');

        await fetch('/register/resend', {
            method: 'POST',
            body: JSON.stringify({
                csrf_token: csrfToken,            
            }),
            headers: {
                'X-CSRF-Token': csrfToken,
                'Content-Type': 'application/json',
            },
        }).then(res => res.text()).then(data => {
            if (data.toString().toLowerCase() === 'succes') {
                verifyText.innerText = 'Succesfully sended the new verify email.';
            } else {
                verifyText.innerText = data.toString();
            };
        }).catch((err) => {
            verifyText.innerText = 'Unknown error when sending new verify email.';
        });
    });
});