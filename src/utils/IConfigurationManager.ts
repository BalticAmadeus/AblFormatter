export interface IConfigurationManager {
    get(name: string): any;
    getTabSize(): any;
    getCasing(): any;
    setOverridingSettings(settings: any): void;
}
