let modalCount = 0;
let originalOverflow = "";

export function lockBodyScroll() {
  if (modalCount === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  modalCount++;
}

export function unlockBodyScroll() {
  modalCount--;
  if (modalCount === 0) {
    document.body.style.overflow = originalOverflow;
  }
}
