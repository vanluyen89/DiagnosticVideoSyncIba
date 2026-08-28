export const COFFEE_POPUP_EVENT = 'e-dash:show-coffee-popup';

export function showCoffeePopup() {
  window.dispatchEvent(new Event(COFFEE_POPUP_EVENT));
}
