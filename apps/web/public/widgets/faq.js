(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  var search = document.getElementById('faq-search');
  var count = document.getElementById('faq-count');
  var empty = document.getElementById('faq-empty');

  // Accordion: several answers can be open at the same time.
  items.forEach(function (item) {
    var question = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    question.addEventListener('click', function () {
      var open = question.getAttribute('aria-expanded') === 'true';
      question.setAttribute('aria-expanded', String(!open));
      answer.hidden = open;
    });
  });

  // Search: matches the question and the answer text, case-insensitive.
  function applyFilter() {
    var query = search.value.trim().toLowerCase();
    var visible = 0;
    items.forEach(function (item) {
      var text = item.textContent.toLowerCase();
      var match = query === '' || text.indexOf(query) !== -1;
      item.hidden = !match;
      if (match) visible += 1;
    });
    count.textContent = visible + ' of ' + items.length + ' questions';
    empty.hidden = visible !== 0;
  }

  search.addEventListener('input', applyFilter);
  applyFilter();
})();
