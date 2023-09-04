function changeType(input, type) {
    console.log('Called')
    input.type = type.toString();
};

document.addEventListener('DOMContentLoaded', async () => {

    let resetErrorP = document.getElementById('reset-error');
    let rangeInput = document.querySelector('input[id*="amount-range"]');
    let currencySelect = document.querySelector('select[id*="currency-select"]');
    let priceP = document.getElementById('price-p');
    let oldPasswordInput = document.querySelector('input[name="old_password"]');
    let isTypingRepeatRegister = false;

    priceP.innerText = 'Price $2.00';
    rangeInput.value = 1;

    console.log(currencySelect.value)

    oldPasswordInput.addEventListener('focus', async (e) => {
        isTypingRepeatRegister = true;
    });

    oldPasswordInput.addEventListener('blur', async (e) => {
        isTypingRepeatRegister = false;
    });

    oldPasswordInput.addEventListener('mouseover', async (e) => {
        let repeatRegisterTimeout = setTimeout(() => {
            if (isTypingRepeatRegister == false) {
                changeType(oldPasswordInput, 'text');
                clearTimeout(repeatRegisterTimeout);
            } else {
                changeType(oldPasswordInput, 'password');
            };
        }, 200);
    });

    oldPasswordInput.addEventListener('mouseout', async (e) => {
        changeType(oldPasswordInput, 'password');
    });

    oldPasswordInput.addEventListener('touchstart', async (e) => {
        changeType(oldPasswordInput, 'text');
    });

    oldPasswordInput.addEventListener('touchend', async (e) => {
        changeType(oldPasswordInput, 'password');
    });

    rangeInput.addEventListener('change', async () => {
        await fetch('/account/price/calculate', {
            method: 'POST',
            body: JSON.stringify({
                amount: rangeInput.value,
                currency: currencySelect.value,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(res => res.text()).then((data) => {
            console.log(data);
            priceP.innerText = ('Price ' + data.toString()).toString();
        }).catch((err) => {
            priceP.innerText = err.message;
        });
    });

    currencySelect.addEventListener('change', async () => {
        await fetch('/account/price/calculate', {
            method: 'POST',
            body: JSON.stringify({
                amount: rangeInput.value,
                currency: currencySelect.value,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(res => res.text()).then((data) => {
            console.log(data);
            priceP.innerText = ('Price ' + data.toString()).toString();
        }).catch((err) => {
            priceP.innerText = err.message;
        });
    });

    document.getElementById('reset-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        let csrfToken = document.querySelector('input[name="csrf_token"').value;

        let formDataJson = {
            old_password: oldPasswordInput.value,
            new_password: document.querySelector('input[name="new_password"]').value,
            csrf_name: csrfToken,
        };

        await fetch('/account/update', {
            method: 'POST',
            body: JSON.stringify(formDataJson),
            headers: {
                'X-CSRF-Token': csrfToken,
                'Content-Type': 'application/json',
            },
            keepalive: true,
        }).then(res => res.text()).then((data) => {
            if (data.toString().toLowerCase().includes('error')) {
                resetErrorP.innerText = 'Error when reseting password.';
            } else {
                window.location.reload();
            };
        }).catch((err) => {
            resetErrorP.innerText = err.toString();
        });
    });

    document.getElementById('pre-form').addEventListener('submit', async (e) => {

        e.preventDefault();

        let csrfToken = document.querySelector('input[name="csrf_token"]').value;

        await fetch('/payment/client-secret', {
            method: 'POST',
            body: JSON.stringify({
                amount: rangeInput.value,
                csrf_token: csrfToken,
                currency: currencySelect.value,
            }),
            headers: {
                'X-CSRF-Token': csrfToken,
                'Content-Type': 'application/json',
            },
            keepalive: true,
        }).then(res => res.text()).then((data) => {
            if (data.toString().toLowerCase().includes('error') && !data.toString().toLowerCase().includes('html')) {
                resetErrorP.innerText = 'Error when trying to redirect to payment form.';
            } else {
                document.open();
                document.write(data);
                document.close();
            };
        }).catch((err) => {
            resetErrorP.innerText = err.toString();
        });
    })
});