export = EasySAXParser;

declare class EasySAXParser {
    static entityDecode(s: string): string;

    ns(root: string | false, namespaces: Record<string, string>): void;

    setup(options: EasySAXParser.SetupOptions): void;

    on(name: 'error', callback: (msgError: string) => void): this;
    on(name: 'startNode' | 'opentag' | 'openTag', callback: (
        nodeName: string,
        getAttr: () => Record<string, string>,
        isTagEnd: boolean,
        getStrNode: () => string
    ) => void): this;
    on(name: 'endNode' | 'closetag' | 'closeTag', callback: (
        nodeName: string,
        isTagStart: boolean,
        getStrNode: () => string
    ) => void): this;
    on(name: 'text' | 'textNode', callback: (text: string) => void): this;
    on(name: 'cdata', callback: (data: string) => void): this;
    on(name: 'comment', callback: (text: string) => void): this;
    on(name: 'question', callback: () => void): this;
    on(name: 'attention', callback: () => void): this;
    on(name: 'unknownNS', callback: (key: string) => void): this;
    on(name: string, callback: (...args: any[]) => void): this;

    write(chunk: string): void;
    end(chunk?: string): void;
}

declare namespace EasySAXParser {
    interface SetupOptions {
        entityDecode?: (s: string) => string;
        autoEntity?: boolean;
        defaultNS?: string;
        ns?: Record<string, string>;
        on?: Record<string, (...args: any[]) => void>;
        strict?: boolean;
        salt?: number;
        intern?: boolean;
        lazy?: boolean;
        map?: Map<any, any>;
    }
}