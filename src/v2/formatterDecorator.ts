export const formatterRegistry: { [formatterLabel: string]: any } = {};

export let formatterId: number = 0;

export function RegisterFormatter(target: any) {
    console.log("aaa");
    formatterRegistry[formatterId] = target;
    console.log("Formatter was found:", formatterId, target.formatterLabel);

    formatterId++;
}

export function RegisterFormatter2(target: any) {
    console.log("aaa2");
    formatterRegistry[formatterId] = target;
    console.log("Formatter was found:", formatterId, target.formatterLabel);

    formatterId++;
}
