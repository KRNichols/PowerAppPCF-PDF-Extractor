import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { PDFDocument, PDFField, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } from 'pdf-lib';

export class PDFExtractor implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _dropZone: HTMLDivElement;
    private _notifyOutputChanged: () => void;
    private _extractedData = "";
    private _resetTrigger?: number; // Store the last reset value

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
        this._notifyOutputChanged = notifyOutputChanged;
        this._container = container;

        // Initialize resetTrigger
        this._resetTrigger = context.parameters.resetTrigger?.raw ?? 0;

        // Create drop zone div
        this._dropZone = document.createElement("div");
        this._dropZone.className = "pdf-drop-zone";
        this._dropZone.innerText = "Drag and drop the PDF here";

        // Add drag and drop event listeners
        this._dropZone.addEventListener("dragover", (e: DragEvent) => {
            e.preventDefault();
            this._dropZone.classList.add("drag-over");
        });
        this._dropZone.addEventListener("dragleave", () => {
            this._dropZone.classList.remove("drag-over");
        });
        this._dropZone.addEventListener("drop", (e: DragEvent) => {
            e.preventDefault();
            this._dropZone.classList.remove("drag-over");
            const files = e.dataTransfer?.files;
            if (files && files.length > 0 && files[0].type === "application/pdf") {
                this.processPDF(files[0]);
            } else {
                alert("Please drop a valid PDF file.");
            }
        });

        this._container.appendChild(this._dropZone);
    }

    private async processPDF(file: File): Promise<void> {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const form = pdfDoc.getForm();
            const fields = form.getFields();

            const data: Record<string, unknown> = {};
            const fieldNames: string[] = [];

            fields.forEach((field: PDFField) => {
                const name = field.getName();
                fieldNames.push(name);

                if (field instanceof PDFTextField) {
                    data[name] = field.getText() || "";
                } else if (field instanceof PDFCheckBox) {
                    data[name] = field.isChecked();
                } else if (field instanceof PDFRadioGroup) {
                    data[name] = field.getSelected() || "";
                } else if (field instanceof PDFDropdown) {
                    data[name] = field.getSelected() || "";
                } else if (field instanceof PDFOptionList) {
                    data[name] = field.getSelected() || [];
                } else {
                    data[name] = "Unsupported field type";
                }
            });

            // Output JSON with data and fields map for debugging
            this._extractedData = JSON.stringify({ data, fields: fieldNames });
            this._notifyOutputChanged();

            // Optional: Update UI to show success
            this._dropZone.innerText = "PDF processed. Data extracted.";
        } catch (error) {
            console.error("PDF processing error:", error);
            alert("Error extracting PDF data. Ensure it's a valid form PDF.");
        }
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const newResetTrigger = context.parameters.resetTrigger?.raw ?? 0;

        // Check if resetTrigger has changed
        if (newResetTrigger !== this._resetTrigger) {
            this.resetComponent();
            this._resetTrigger = newResetTrigger;
        }
    }

    private resetComponent(): void {
        // Clear extracted data and notify
        this._extractedData = "";
        this._notifyOutputChanged();

        // Reset UI
        if (this._dropZone) {
            this._dropZone.innerText = "Drag and drop the PDF here";
        }
    }

    public getOutputs(): IOutputs {
        return {
            ExtractedData: this._extractedData
        };
    }

    public destroy(): void {
        // Cleanup if needed
    }
}