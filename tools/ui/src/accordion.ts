export class Accordion {
  private accordion: Element;
  private header: Element;
  private expandedAccordionHeader: Element;
  private body: Element;
  private headerContainer: Element;
  private bodyContainer: Element;
  private accordionToggler: Element;

  private icon =
    '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAX1JREFUSEuVVtthwzAIPDZxNklG6STtJk0nySreRC2IWCDAcvXjl3wHx4FNOBYBaOmVfwIg3PC3xmOSrbrsWwmC7NL7VxgN6uAozgSv4kyI51B9BlWQIc86S0I7xO4SBVDWbmwae3xsY0+1v0OnRbNq+aJlxLXKtNZX+XXjnH5Wm+giK9EC6EqtrTONTa1Si0r/Q1dHkCj5CeAHwJ51C4ANwP3v+KyqYIocombwLwV/WBIFY/DvTkAfhPbsc8Dr7Yo86csAL41yB+GBdmQi4ATcm2RHN2tZGTmG58ymngTgTHhp5EJ48/L4MGMfxDmzAe0FwqYZMCjrbsCDDd2EcxdvX0/NtTWRi5iMM97R5sinhn3bPW80bX3bEz0DrgkvkSW8mzSJsWnULnapZMAFz8drwlj0wfnwijIm48S5yI5iG0XS0GtZShclUScjdSr+8SGysPN5bePFSLqSjauBjW78AFQsNmPvOvfzsI5iYcdKG1PXs06vP1XTkzx74Bcf2cYgupuPUwAAAABJRU5ErkJggg==" />';
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
