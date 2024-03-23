import MEModule from "@/packages/modules/module";
import { CommandFunction, MECommandObj } from "@/packages/types";
import domUtils from "@/packages/utils/domUtils";


export default class MECommand extends MEModule {

    commands!: { [key: string]: MECommandObj };
    options!: { [key: string]: any };

    async prepare(): Promise<boolean> {
        this.bindShortcutKeys();
        return true
    }

    private _hasEnterExecCommand!: boolean;
    registerCommand(command: MECommandObj | CommandFunction | MECommandObj[]) {
        if (typeof command === 'function') {
            command = command.apply(this);
        }

        if (!command) {
            return false;
        }

        this.commands = this.commands || {};

        if (!Array.isArray(command)) {
            command = [command]
        }

        command.forEach((cmd) => {
            this.commands[cmd.cmdName.toLowerCase()] = cmd;
            if (cmd.defaultOptions) {
                this.setOpt(cmd.defaultOptions)
            }
        })


        return true;
    }
    setOpt(opt: string | Object, val?: any) {
        let obj: any = {}
        if (typeof opt === 'string' && val) {
            obj[opt] = val;
        } else if (typeof opt === 'object') {
            obj = opt;
        }
        if(!this.options) {
            this.options = {}
        }
        Object.assign(this.options, obj);
    }
    getOpt(key: string) {
        return key && this.options && this.options[key];
    }
    command(cmdName:string): MECommandObj|undefined {
        return this.commands[cmdName];
    }
    public execCommand(cmdName: string, ...args: any[]) {
        if (!cmdName) {
            return false;
        }

        let result: any;

        cmdName = cmdName.toLowerCase();
        const cmd = this.commands[cmdName];
        if (!cmd) {
            return false;
        }

        const {event} = this.instance.context;

        if (!this._hasEnterExecCommand) {
            this._hasEnterExecCommand = true;

            if (this.queryCommandState.apply(this, [cmdName, ...args]) !== -1) {
                event.trigger.apply(
                    event, ["beforeexeccommand", cmdName, ...args]
                );
                result = this.callCmdFn("execCommand", arguments);
                event.trigger.apply(
                    event, ["afterexeccommand", cmdName, ...args]
                );
            }

            this._hasEnterExecCommand = false;
        } else {
            result = this.callCmdFn('execCommand', arguments);
        }

        !this._hasEnterExecCommand && !cmd.ignoreContentChange && event.trigger('contentchange');
        !this._hasEnterExecCommand && !cmd.ignoreContentChange && event.selectionChange();

        return result;
    }
    queryCommandValue(cmd: string, ...args: any[]) {
        return this.callCmdFn('queryCommandValue', arguments);
    }
    queryCommandState(cmd: string, ...args: any[]) {
        return this.callCmdFn('queryCommandState', arguments);
    }
    queryCommandEnabled(cmd: string) {
        return this.callCmdFn('queryCommandEnabled', arguments);
    }
    queryCommandSupported(cmd: string) {
        return !!this.commands[cmd]
    }
    callCmdFn(fnName: string, args: IArguments) {
        const cmdName = args[0].toLowerCase();
        const cmd: any = this.commands[cmdName];
        const cmdFn = cmd && cmd[fnName];

        args[0] = cmdName;
        if ((!cmd || !cmdFn) && fnName === "queryCommandState") {
            return false;
        } else if (cmdFn) {
            return cmdFn.apply(this, args);
        }
    }

    private bindShortcutKeys() {

        const {editable} = this.instance.context;

        const handler = (e) => {
            const keyCode = e.keyCode || e.which;
            if (!keyCode) {
                return;
            }
            for (const cmdName in this.commands) {
                if (this.commands.hasOwnProperty(cmdName)) {
                    const shortcutKeys = this.commands[cmdName].shortcutKeys;
                    if (shortcutKeys) {
                        for (const key in shortcutKeys) {
                            if (shortcutKeys.hasOwnProperty(key)) {
                                const params = shortcutKeys[key];
                                if (
                                    /^(ctrl)(\+shift)?\+(.+)$/.test(key.toLowerCase()) ||
                                    /^(\w+)$/.test(key.toLowerCase())
                                ) {
                                    if (
                                        ((RegExp.$1 === "ctrl" ? e.ctrlKey || e.metaKey : 0) &&
                                            (RegExp.$2 !== "" ? e.shiftKey : !e.shiftKey) &&
                                            keyCode === domUtils.keyCodes[RegExp.$3]) ||
                                        keyCode === domUtils.keyCodes[RegExp.$1]
                                    ) {

                                        domUtils.preventDefault(e);

                                        if (params.handler) {
                                            params.handler.apply(this, [e, params.data])
                                        } else {
                                            if (this.queryCommandState(cmdName, params.data) !== -1) {
                                                this.execCommand(cmdName, params.data);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        this.mutableListeners.on(editable.document, 'keydown', handler);
    }
   
}