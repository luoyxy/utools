import { readFileSync } from "fs";
import { join } from "path";
import { Plugin, ListItem, IListItem, } from "utools-helper";
import { Action } from "utools-helper/dist/template_plugin";
import { platform } from "process";
import { NewIDE } from "./ide";

export interface Config {
  code?: string;
  icon?: string;
  terminal?: string;
  command?: string;
  database?: string;
  autoDetectDatabase?: string;
  autoDetectDatabaseIDEName?: string;
  timeout?: string;
  collections?: IListItem[];
  [key: string]: string | IListItem[];
}

// 新建配置
export function NewConfig(code: string): Config {
  const shells = {
    "win32": "",
    "darwin": "zsh -l -c",
    "linux": "bash -l -c",
  }

  code = code.toLowerCase()
  return {
    code: code,
    icon: "icon/icon.png",
    terminal: shells[platform as keyof typeof shells],
    command: code.toLowerCase(),
    database: join(
      utools.getPath("appData"),
      code.charAt(0).toUpperCase() + code.slice(1),
      "User",
      "globalStorage",
      "state.vscdb"
    ),
    autoDetectDatabase: "0",
    autoDetectDatabaseIDEName: "Code",
    timeout: "3000"
  }
}

export function GetConfig(code: string): Config {
  let key = utools.getNativeId() + "." + code
  let config = utools.dbStorage.getItem(key) as Config
  if (!config) {
    config = NewConfig(code);
    SaveConfig(config, false);
  }

  // 自动替换AppData路径
  if (config.autoDetectDatabase === "1") {
    config.database = join(
      utools.getPath("appData"),
      config.autoDetectDatabaseIDEName,
      "User",
      "globalStorage",
      "state.vscdb"
    );

  }
  return config;
}

export function SaveConfig(config: Config, ide: boolean = true) {
  if (ide) {
    NewIDE(config)
    console.log("save feature success")
  }
  let key = utools.getNativeId() + "." + config.code
  utools.dbStorage.setItem(key, config)
}

export class Setting implements Plugin {
  code = "vsc-setting"
  config: Config;

  constructor(code: string) {
    this.code = `${code}-setting`;
    this.config = GetConfig(code);
    console.log("init config success: ", this.config)
  }

  enter(action?: Action) {
    utools.setExpendHeight(600);

    // 渲染设置页面
    this.render()

    // 初始化表单逻辑
    this.initForm(this.config);
  }

  private render() {
    const html = readFileSync(join(__dirname, "../public/setting.html"), "utf8");
    // 使用DOM API添加内容到 body 标签内
    const template = document.createElement('template');
    template.innerHTML = html;
    const fragment = document.importNode(template.content, true);
    document.body.appendChild(fragment);
  }

  private initForm(config: Config) {
    const form = document.getElementById('settingsForm');
    if (!form) return;

    // 获取相关元素
    const autoDetectCheckbox = document.getElementById('autoDetectDatabase') as HTMLInputElement;
    const databaseInput = form.querySelector('[name="database"]') as HTMLInputElement;
    const autoDetectDatabaseIDENameInput = form.querySelector('[name="autoDetectDatabaseIDEName"]') as HTMLInputElement;


    // 初始化绑定所有字段
    Object.keys(config).forEach(key => {
      console.log("init config: ", key, config[key]);
      const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement;
      if (input) {
        // 对于复选框，设置 checked 属性
        if (input.type === 'checkbox') {
          input.checked = config[key] === '1';
        } else {
          input.value = config[key] as any;
        }

        // 添加输入事件监听器，更新config对象
        if (input.type === 'checkbox') {
          input.addEventListener('change', (e) => {
            config[key] = (e.target as HTMLInputElement).checked ? '1' : '0';
          });
        } else {
          input.addEventListener('input', (e) => {
            config[key] = (e.target as HTMLInputElement).value;
            console.log("update config: ", key, config[key]);
            
            if (key === "autoDetectDatabaseIDEName") {
              databaseInput.value = join(
                utools.getPath("appData"),
                config.autoDetectDatabaseIDEName,
                "User",
                "globalStorage",
                "state.vscdb"
              );
            }
          });
        }
      }
    });



    if (autoDetectCheckbox && databaseInput && autoDetectDatabaseIDENameInput) {
      // 切换输入框状态的函数
      const toggleInputStates = () => {
        if (autoDetectCheckbox.checked) {
          // 勾选时: 数据库配置只读, 多端版本可编辑
          databaseInput.readOnly = true;
          databaseInput.style.backgroundColor = '#f5f5f5';
          databaseInput.style.cursor = 'not-allowed';

          autoDetectDatabaseIDENameInput.disabled = false;
          autoDetectDatabaseIDENameInput.style.backgroundColor = '#fff';
          autoDetectDatabaseIDENameInput.style.cursor = 'text';

          // 更新 config
          config.autoDetectDatabase = '1';
        } else {
          // 未勾选时: 数据库配置可编辑, 多端版本只读
          databaseInput.readOnly = false;
          databaseInput.style.backgroundColor = '#fff';
          databaseInput.style.cursor = 'text';

          autoDetectDatabaseIDENameInput.disabled = true;
          autoDetectDatabaseIDENameInput.style.backgroundColor = '#f5f5f5';
          autoDetectDatabaseIDENameInput.style.cursor = 'not-allowed';

          // 更新 config
          config.autoDetectDatabase = '0';
        }
      };

      // 初始化状态
      toggleInputStates();

      // 复选框变化时切换状态
      autoDetectCheckbox.addEventListener('change', toggleInputStates);
    }

    // 表单提交处理
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      console.log('表单数据:', config);
      if (!config.icon.includes("png")) {
        alert("图标格式必须是png")
        return
      }

      SaveConfig(config)
      utools.showNotification(`${config.code} 配置已保存`);
      utools.outPlugin(true)
    });
  }
}