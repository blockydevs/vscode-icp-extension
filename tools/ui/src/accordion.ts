export class Accordion {
  private accordion: Element;
  private header: Element;
  private expandedAccordionHeader: Element;
  private body: Element;
  private headerContainer: Element;
  private bodyContainer: Element;
  private accordionToggler: Element;

  private icon =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000" height="16px" width="16px" version="1.1" id="Layer_1" viewBox="0 0 330 330" xml:space="preserve"><path id="XMLID_224_" d="M325.606,229.393l-150.004-150C172.79,76.58,168.974,75,164.996,75c-3.979,0-7.794,1.581-10.607,4.394  l-149.996,150c-5.858,5.858-5.858,15.355,0,21.213c5.857,5.857,15.355,5.858,21.213,0l139.39-139.393l139.397,139.393  C307.322,253.536,311.161,255,315,255c3.839,0,7.678-1.464,10.607-4.394C331.464,244.748,331.464,235.251,325.606,229.393z"/></svg>';
  constructor(
     header: Element,
     expandedAccordionHeader: Element,
     body: Element
  ) {
    this.header = header;
    this.body = body;
    this.expandedAccordionHeader = expandedAccordionHeader;

    this.accordion = document.createElement("div");
    this.accordion.className = "accordion";

    this.accordionToggler = document.createElement("span");
    this.accordionToggler.className = "toggler";
    this.accordionToggler.innerHTML = this.icon;
    this.handleToggling();

    this.headerContainer = document.createElement("div");
    this.headerContainer.className = "accordion__header";
    this.headerContainer.appendChild(this.header);
    this.headerContainer.appendChild(this.accordionToggler);

    this.bodyContainer = document.createElement("div");
    this.bodyContainer.className = "accordion__body";
    this.bodyContainer.appendChild(this.body);


    this.accordion.appendChild(this.headerContainer);
    this.accordion.appendChild(this.bodyContainer);
  }
  getAccordion(): Element {
    return this.accordion;
  }

  private handleToggling() {
    this.accordionToggler.addEventListener("click", () => {
      let target =  this.accordionToggler?.parentNode?.parentNode as Element | undefined;
      if (!target) return;

      if (!target?.classList.contains("accordion--expand")) {
        target.classList.add("accordion--expand");
        this.headerContainer.removeChild(this.header);
        this.headerContainer.prepend(this.expandedAccordionHeader);
      } else {
        target.classList.remove("accordion--expand");
        this.headerContainer.removeChild(this.expandedAccordionHeader);
        this.headerContainer.prepend(this.header);

      }
    });
  }
}
