export interface IConfigurationManager {
    get(name: string): any;
    getCasing(): any;
    setOverridingSettings(settings: any): void;
}
