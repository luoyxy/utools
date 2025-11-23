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
  autoDetectDatabaseIDEDir?: string;
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
    autoDetectDatabase: "1",
    autoDetectDatabaseIDEDir: code.charAt(0).toUpperCase() + code.slice(1),
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

  if (!config.autoDetectDatabase) {
    config.autoDetectDatabase = "0";
  }
  if (!config.autoDetectDatabaseIDEDir) {
    config.autoDetectDatabaseIDEDir = code;
  }
  // 自动替换AppData路径
  if (config.autoDetectDatabase === "1") {
    config.database = join(
      utools.getPath("appData"),
      config.autoDetectDatabaseIDEDir,
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
    if (!this.config.autoDetectDatabaseIDEDir) {
      this.config.autoDetectDatabaseIDEDir = "Code";
    }
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
    const databaseContainer = document.getElementById('databaseContainer') as HTMLDivElement;
    const autoDetectDatabaseContainer = document.getElementById('autoDetectDatabaseContainer') as HTMLDivElement;
    const databaseTipsElement = document.getElementById('databaseTips') as HTMLDivElement;

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
            // 复选框变化时更新容器显示状态
            if (key === 'autoDetectDatabase') {
              this.toggleDatabaseMode(form, config, autoDetectCheckbox.checked, databaseContainer, autoDetectDatabaseContainer);
              this.updateDatabaseTips(config, databaseTipsElement);
            }
          });
        } else {
          input.addEventListener('input', (e) => {
            config[key] = (e.target as HTMLInputElement).value;


            // 当修改 autoDetectDatabaseIDEDir 时，自动计算数据库路径
            if (key === "autoDetectDatabaseIDEDir") {
              config.database = join(
                utools.getPath("appData"),
                config.autoDetectDatabaseIDEDir,
                "User",
                "globalStorage",
                "state.vscdb"
              );
              this.updateDatabaseTips(config, databaseTipsElement);
            }

            // 当修改 database 时，更新提示
            if (key === "database") {
              this.updateDatabaseTips(config, databaseTipsElement);
            }
          });
        }
      }
    });

    // 初始化数据库模式显示状态
    this.toggleDatabaseMode(form, config, autoDetectCheckbox.checked, databaseContainer, autoDetectDatabaseContainer);

    // 初始化数据库路径提示
    this.updateDatabaseTips(config, databaseTipsElement);

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

  /**
   * 切换数据库模式的显示状态
   * @param config 配置对象
   * @param isAutoDetect 是否启用自动适配
   * @param databaseContainer 数据库手动配置容器
   * @param autoDetectDatabaseContainer 自动适配容器
   */
  private toggleDatabaseMode(
    form: HTMLElement,
    config: Config,
    isAutoDetect: boolean,
    databaseContainer: HTMLDivElement,
    autoDetectDatabaseContainer: HTMLDivElement
  ) {
    if (isAutoDetect) {
      // 启用自动适配模式
      databaseContainer.style.display = 'none';
      autoDetectDatabaseContainer.style.display = 'block';
    } else {
      // 手动配置模式
      const databaseInput = form.querySelector('[name="database"]') as HTMLInputElement;
      databaseInput.value = config.database as string;
      databaseContainer.style.display = 'block';
      autoDetectDatabaseContainer.style.display = 'none';
    }
  }

  /**
   * 更新数据库路径提示
   * @param config 配置对象
   * @param databaseTipsElement 提示元素
   */
  private updateDatabaseTips(config: Config, databaseTipsElement: HTMLDivElement) {
    if (databaseTipsElement && config.database) {
      databaseTipsElement.textContent = config.database as string;
    }
  }
}