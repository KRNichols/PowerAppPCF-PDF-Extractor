/*
*This is auto generated from the ControlManifest.Input.xml file
*/

// Define IInputs and IOutputs Type. They should match with ControlManifest.
export interface IInputs {
    ExtractedData: ComponentFramework.PropertyTypes.StringProperty;
    resetTrigger: ComponentFramework.PropertyTypes.WholeNumberProperty;
}
export interface IOutputs {
    ExtractedData?: string;
}
