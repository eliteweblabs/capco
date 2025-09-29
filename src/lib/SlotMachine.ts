// SlotMachine Class - Simplified modal picker
export class SlotMachine {
  private id: string;
  private title: string;
  private options: Array<{ value: string; label: string; disabled?: boolean }>;
  private selectedValue: string;
  private skipSaveToAPI: boolean;

  private trigger: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private optionsList: HTMLElement | null = null;
  private hiddenInput: HTMLInputElement | null = null;

  constructor(config: {
    id: string;
    title: string;
    options: Array<{ value: string; label: string; disabled?: boolean }>;
    selectedValue?: string;
    skipSaveToAPI?: boolean;
  }) {
    this.id = config.id;
    this.title = config.title;
    this.options = config.options || [];
    this.selectedValue = config.selectedValue || "";
    this.skipSaveToAPI = config.skipSaveToAPI || false;

    this.init();
  }

  private init(): void {
    this.trigger = document.getElementById(this.id);
    this.modal = document.getElementById(`${this.id}-modal`);
    this.optionsList = document.getElementById(`${this.id}-options`);
    this.hiddenInput = document.getElementById(`${this.id}-value`) as HTMLInputElement;

    if (!this.trigger || !this.modal) {
      console.error(`[SLOT-MACHINE] Required elements not found for ${this.id}`);
      return;
    }

    this.setupEventListeners();
    this.renderOptions();
  }

  private setupEventListeners(): void {
    // Trigger button click
    this.trigger.addEventListener("click", () => {
      this.openModal();
    });

    // Modal backdrop click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Close button
    const closeBtn = this.modal.querySelector(".slot-machine-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.closeModal();
      });
    }

    // Cancel button
    const cancelBtn = this.modal.querySelector("[data-modal-hide]");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        this.closeModal();
      });
    }
  }

  private renderOptions(): void {
    if (!this.optionsList) return;

    this.optionsList.innerHTML = "";

    this.options.forEach((option, index) => {
      const li = document.createElement("li");
      li.className = `slot-machine-item ${option.disabled ? "disabled" : ""} ${this.selectedValue === option.value ? "selected" : ""}`;
      li.dataset.value = option.value;
      li.dataset.label = option.label;
      li.dataset.index = index.toString();
      li.textContent = option.label;

      if (!option.disabled) {
        li.addEventListener("click", () => {
          this.selectOption(option);
        });
      }

      this.optionsList.appendChild(li);
    });
  }

  private openModal(): void {
    this.modal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  private closeModal(): void {
    this.modal?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  private selectOption(option: { value: string; label: string; disabled?: boolean }): void {
    this.selectedValue = option.value;
    this.updateUI(option);
    this.closeModal();

    // Trigger change event
    this.triggerChangeEvent(option);
  }

  private updateUI(option: { value: string; label: string }): void {
    // Update trigger button text
    if (this.trigger) {
      this.trigger.textContent = option.label;
    }

    // Update hidden input
    if (this.hiddenInput) {
      this.hiddenInput.value = option.value;
    }

    // Update selected state in options
    this.optionsList?.querySelectorAll(".slot-machine-item").forEach((item) => {
      item.classList.remove("selected");
      if (item.dataset.value === option.value) {
        item.classList.add("selected");
      }
    });
  }

  private triggerChangeEvent(option: { value: string; label: string }): void {
    const event = new CustomEvent("slotMachineChange", {
      detail: {
        id: this.id,
        value: option.value,
        label: option.label,
        option: option,
      },
      bubbles: true,
    });

    this.trigger?.dispatchEvent(event);
  }

  // Public methods
  public getSelectedValue(): string {
    return this.selectedValue;
  }

  public setSelectedValue(value: string): void {
    const option = this.options.find((opt) => opt.value === value);
    if (option) {
      this.selectOption(option);
    }
  }

  public updateOptions(
    newOptions: Array<{ value: string; label: string; disabled?: boolean }>
  ): void {
    this.options = newOptions;
    this.renderOptions();
  }

  public open(): void {
    this.openModal();
  }

  public close(): void {
    this.closeModal();
  }
}

// Make SlotMachine available globally
if (typeof window !== "undefined") {
  (window as any).SlotMachine = SlotMachine;
}
