(function () {
  var form = document.getElementById('feedback-form');
  var error = document.getElementById('feedback-error');
  var thanks = document.getElementById('feedback-thanks');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var chosen = form.querySelector('input[name="helpful"]:checked');
    if (!chosen) {
      error.hidden = false;
      return;
    }
    error.hidden = true;
    // Client-side only: nothing is sent anywhere. The thank-you message replaces the form.
    thanks.setAttribute('data-answer', chosen.value);
    form.hidden = true;
    thanks.hidden = false;
  });

  // Choosing an answer clears the validation message.
  form.addEventListener('change', function () {
    error.hidden = true;
  });
})();
