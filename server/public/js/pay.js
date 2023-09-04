document.addEventListener('DOMContentLoaded', async (e) => {

    document.querySelector('input[id*="wants-yearly"]').checked = false;

    document.querySelector('input[id*="wants-yearly"]').addEventListener('change', async (e) => {
        let productName = document.getElementById('product-name');

        if (e.target.checked === true) {
            if (productName.innerText.toString().toLowerCase().includes('monthly')) {
                let textString = '';
                let splittedText = productName.innerText.toString().split(' ');
                let middlePartText = splittedText[1].toLowerCase().replace('monthly', 'Yearly').toString();

                splittedText.splice(1, 1);
                splittedText.splice(1, 0, middlePartText.toString());

                for (let splittedT of splittedText) {
                    textString += (splittedT.toString() + ' ').toString();
                };

                productName.innerText = textString;
            };
        } else {
            if (productName.innerText.toString().toLowerCase().includes('yearly')) {
                let textString = '';
                let splittedText = productName.innerText.toString().split(' ');
                let middlePartText = splittedText[1].toLowerCase().replace('yearly', 'Monthly').toString();

                splittedText.splice(1, 1);
                splittedText.splice(1, 0, middlePartText.toString());

                for (let splittedT of splittedText) {
                    textString += (splittedT.toString() + ' ').toString();
                };

                productName.innerText = textString;
            };
        };
    });

    document.querySelector('#submit-btn').addEventListener('click', async (e) => {
        let paymentMethod = document.querySelector('select[id*="payment-method"]').value;
        let csrfToken = document.querySelector('input[name="csrf_token"]').value;
        let productName = document.getElementById('product-name').innerText;
        let wantsYearly = document.querySelector('input[id*="wants-yearly"]').checked;

        if (paymentMethod) {
            let clientSecret = await fetch('/payment/client-secret', {
                method: 'POST',
                keepalive: true,
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productName: productName.toString(),
                    pm: paymentMethod,
                    csrf_token: csrfToken,
                    wantsYearly: wantsYearly,
                }),
            }).then(res => res.text()).then(data => {
                document.open();
                document.write(data);
                document.close();
            }).catch(err => {
                window.location.reload();
            });
        };
    });
});