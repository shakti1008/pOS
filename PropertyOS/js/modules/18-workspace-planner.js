/* A private, device-only planning tool. No account or network request needed. */
(() => {
  const money = value => '₹' + Math.round(value).toLocaleString('en-IN');
  function mount() {
    const landing = document.querySelector('#p7feat');
    if (!landing || document.querySelector('#rent-planner')) return;
    const section = document.createElement('section');
    section.id = 'rent-planner';
    section.className = 'p7s';
    section.innerHTML = `<span class="kick">Plan your next month</span><h2>A clearer view of your rent</h2>
      <p class="sub">Explore a monthly scenario. Your numbers stay on this page and are never saved or sent.</p>
      <div class="g planner-grid"><form class="planner-inputs" aria-label="Rent scenario">
      <label>Total units<input name="units" type="number" min="1" max="10000" step="1" value="12" required></label>
      <label>Occupied units<input name="occupied" type="number" min="0" max="12" step="1" value="10" required></label>
      <label>Monthly rent per unit (₹)<input name="rent" type="number" min="1" max="10000000" step="1" value="15000" required></label>
      <label>Monthly operating costs (₹)<input name="costs" type="number" min="0" max="100000000000" step="1" value="25000" required></label>
      <button type="reset" class="btn q">Reset scenario</button></form>
      <div class="planner-results" aria-live="polite" aria-atomic="true"></div></div>`;
    landing.before(section);
    const form = section.querySelector('form');
    const results = section.querySelector('.planner-results');
    function update() {
      const units = Number(form.elements.units.value);
      form.elements.occupied.max = String(units);
      if (!form.checkValidity()) {
        results.textContent = 'Enter whole numbers within the limits. Occupied units cannot exceed total units.';
        return;
      }
      const occupied = Number(form.elements.occupied.value), rent = Number(form.elements.rent.value), costs = Number(form.elements.costs.value);
      const expected = occupied * rent, net = expected - costs;
      results.innerHTML = `<small>EXPECTED MONTHLY RENT</small><strong>${money(expected)}</strong>
        <div class="planner-meter" role="meter" aria-label="Occupancy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(occupied / units * 100)}"><i style="width:${occupied / units * 100}%"></i></div>
        <p>${occupied} of ${units} units occupied · ${Math.round(occupied / units * 100)}%</p>
        <dl><div><dt>Vacancy opportunity</dt><dd>${money((units - occupied) * rent)}</dd></div><div><dt>After operating costs</dt><dd>${money(net)}</dd></div></dl>
        <p class="planner-note">${net < 0 ? 'Costs exceed expected rent. Review your costs or occupancy.' : occupied < units ? 'Fill vacant units to grow collections. Publish vacancies from Properties.' : 'Fully occupied. Review upcoming renewals to plan ahead.'}</p>
        <small>Estimate assumes full collection. Excludes taxes, financing and unpaid rent.</small>`;
    }
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('input', update);
    form.addEventListener('reset', () => setTimeout(update, 0));
    update();
  }
  new MutationObserver(mount).observe(document.querySelector('#gate'), {childList: true, subtree: true});
  mount();
})();
