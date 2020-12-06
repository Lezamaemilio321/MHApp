var stripe = Stripe('pk_test_51H8U0PDJkyUQj3aZXiUP678UXs7ksLAhKJ15HuqgGwGJ4QofqDQpWQlMBSedKmw5CSqdy0UifBH7FR16xtPlqMCi00ENMwSG12');

function myAlert(content) {
    const body = document.body;
    const darkArea = document.querySelector('.alert-background');
    const alert = document.querySelector('.alert');
    const okBtn = alert.getElementsByTagName('button')[0];
    const popupButtons = document.querySelectorAll('.book-button');


    alert.getElementsByTagName('p')[0].textContent = content;


    darkArea.style.zIndex = 11;

    darkArea.classList.add('active');
    alert.classList.add('active');
    body.classList.add('no-scroll');

    okBtn.addEventListener('click', () => {
        alert.classList.remove('active');


        darkArea.classList.remove('active');
        body.classList.remove('no-scroll');

        darkArea.style.zIndex = 9;

        for (let btn of popupButtons) {
            btn.disabled = false;
        }
    });
}

let popupForms = document.querySelectorAll('.service-popup');

if (popupForms) {


    const cardsNode = document.querySelectorAll('.service-card');
    const cards = Array.prototype.slice.call(cardsNode);

    for (let form of popupForms) {

        let btn = form.querySelector('.confirm-button');

        btn.addEventListener('click', bookClicked);

        
        function bookClicked (event) {

            event.preventDefault();

            const card = cards.find(el => el.dataset.serviceId == btn.id);

            const popup = card.querySelector('.service-popup');

            const name = card.querySelector('.service-name');
            const nameLabel = card.querySelector('.name-label');
            const [email1, email2] = card.querySelectorAll('.service-email');
            const [label1, label2] = card.querySelectorAll('.email-label');
            const errorMessage = card.querySelector('.error-message');

            function validateEmail(email) {
                const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(String(email).toLowerCase());
            }

            function scrollToTop() {
                popup.scrollTop = 0;
            }


            if (!name.value) {
                name.classList.add('empty');
                nameLabel.classList.add('empty');

                if (!email1.value) {
                    email1.classList.add('empty');
                    label1.classList.add('empty');
    
                    if (!email2.value) {
                        email2.classList.add('empty');
                        label2.classList.add('empty');
                        scrollToTop();
                        return;
                    }
                }
                
                
                scrollToTop();
                return;
            }

            if (!email1.value) {
                email1.classList.add('empty');
                label1.classList.add('empty');

                if (!email2.value) {
                    email2.classList.add('empty');
                    label2.classList.add('empty');
                    scrollToTop();
                    return;
                }

                scrollToTop();
                return;
            }

            if (!email2.value) {
                email2.classList.add('empty');
                label2.classList.add('empty');
                scrollToTop();
                return;
            }

            if (!validateEmail(email1.value)) {
                email1.classList.add('empty');
                errorMessage.textContent = "Correo invalido."
                errorMessage.classList.add('active');
                scrollToTop();
                return;
            }


            if (email1.value != email2.value) {
                email2.classList.add('empty');
                label2.classList.add('empty');
                errorMessage.textContent = "Los correos electronicos no coinciden."
                errorMessage.classList.add('active');
                scrollToTop();
                return;
            }

            const btnWidth = `${btn.offsetWidth}px`;
            const btnHeight = `${btn.offsetHeight}px`;

            btn.style.width = btnWidth;
            btn.style.height = btnHeight;
            btn.style.padding = '10px';
            btn.innerHTML = '<img src="/images/load-arrow.png" class="load-arrow">'

            btn.querySelector('.load-arrow').style.maxHeight = `${btn.offsetHeight-20}px`;

            purchaseClicked(btn);
        }
    }

    function purchaseItemHook(purchaseInfo) {

        if (purchaseInfo) {
                
            fetch('/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    purchase_info: purchaseInfo
                })
            })
            .then(res => {
                return res.json();
            }).then(data => {
    
                const sessionID = data.session_id;
                stripe.redirectToCheckout({sessionId: sessionID});
    
    
            }).catch(error => myAlert('Perdon, hubo un error'));
    
        }
    }
    


    
    function purchaseClicked(target = null) {

        if (!target) {
            return myAlert('Perdon, hubo un error');
        }
    
        const card = document.querySelector(`[data-service-id~="${target.id}"]`);
        const inputs = card.querySelectorAll('.service-input');
        const email = card.querySelector('.service-email');
        const name = card.querySelector('.service-name');

        if (typeof(email.value) != "string" || typeof(name.value) != "string") {
            return myAlert('Perdon, hubo un error');
        }


        if (!inputs.length == 2) {
            return myAlert('Perdon, hubo un error');
        }

        for (let inp of inputs) {
            if (isNaN(inp.value) || inp.value <= 0 || inp.value >= 7) {
                return myAlert('Perdon, hubo un error');
            }
        }

        const purchaseInfo = { id: target.id, people: inputs[0].value, duration: inputs[1].value, email: email.value, name: name.value }
            
        purchaseItemHook(purchaseInfo);

    }

}