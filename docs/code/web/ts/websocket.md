# WebSocket

支持断网重连、自动心跳

## 实现逻辑

1. 封装官方的websocket
* 初始化连接并处理各种 WebSocket 事件（打开、消息、关闭、错误）。
* 发送消息到服务器。
* 关闭连接。
2. 自动断网重连
* `记录重连次数`：通过 reconnectAttempts 属性记录当前已经尝试重连的次数。
* `设置最大重连次数`：通过 maxReconnectAttempts 属性设置允许的最大重连次数。
* `重连逻辑`：在 onclose 和 onerror 事件中调用重连处理函数 handleReconnect。
* `重连间隔`：通过 reconnectInterval 属性设置每次重连的间隔时间，可以在每次重连时增加间隔以实现指数退避。
* 在 `handleReconnect` 方法中，实现了实际的重连逻辑。
3. 自动心跳封装
* `发送心跳消息`：在 WebSocket 连接建立后，启动一个定时器，定期发送心跳消息到服务器。
* `接收心跳响应`：服务器收到心跳消息后返回响应，客户端接收到响应后重置定时器。
* `检测心跳超时`：如果在指定时间内没有收到心跳响应，则认为连接断开，进行重连。
* `startHeartbeat()` 方法启动一个定时器，每隔 `heartbeatInterval` 时间（30秒）发送一次心跳消息。
* `closeHeartbeat()` 方法用于停止心跳检测，清除定时器。
4. 触发原生函数
* 借助几个自定义的生命周期函数
* 当原生的`onclose、onopen`方法触发时，会通过`dispatchEvent`触发相应的调度，进而触发通过`addEventListener`绑定的生命周期函数！
* 这里的`this.dispatchEvent`方法，`addEventListener`方法都是通过类继承`EventDispatcher`方法获得的


## js封装示例

```js
//// WebSocketClient.js
class Log {
    static console = true;
    log(title, text) {
        if (!Log.console) return;
        if (import.meta.env.MODE === 'production') return;
        const color = '#ff4d4f';
        console.log(
            `%c ${title} %c ${text} %c`,
            `background:${color};border:1px solid ${color}; padding: 1px; border-radius: 2px 0 0 2px; color: #fff;`,
            `border:1px solid ${color}; padding: 1px; border-radius: 0 2px 2px 0; color: ${color};`,
            'background:transparent'
        );
    }
    closeConsole() {
        Log.console = false;
    }
}
export class EventDispatcher extends Log {
    listeners = {};

    addEventListener(type, listener) {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        if (this.listeners[type].indexOf(listener) === -1) {
            this.listeners[type].push(listener);
        }
    }

    removeEventListener(type) {
        this.listeners[type] = [];
    }

    dispatchEvent(type, data) {
        const listenerArray = this.listeners[type] || [];
        if (listenerArray.length === 0) return;
        listenerArray.forEach(listener => {
            listener.call(this, data);
        });
    }
}

//// core
export class WebSocketClient extends EventDispatcher {
    // #socket链接
    url = '';
    // #socket实例
    socket = null;
    // #重连次数
    reconnectAttempts = 0;
    // #最大重连数
    maxReconnectAttempts = 5;
    // #重连间隔
    reconnectInterval = 10000; // 10 seconds
    // #发送心跳数据间隔
    heartbeatInterval = 1000 * 30;
    // #计时器id
    heartbeatTimer = undefined;
    // #彻底终止ws
    stopWs = false;
    // *构造函数
    constructor(url) {
        super();
        this.url = url;
    }
    // >生命周期钩子
    onopen(callBack) {
        this.addEventListener('open', callBack);
    }
    onmessage(callBack) {
        this.addEventListener('message', callBack);
    }
    onclose(callBack) {
        this.addEventListener('close', callBack);
    }
    onerror(callBack) {
        this.addEventListener('error', callBack);
    }
    // >消息发送
    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.error('[WebSocket] 未连接');
        }
    }

    // !初始化连接
    connect() {
        if (this.reconnectAttempts === 0) {
            this.log('WebSocket', `初始化连接中...          ${this.url}`);
        }
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }
        this.socket = new WebSocket(this.url);

        // !websocket连接成功
        this.socket.onopen = event => {
            this.stopWs = false;
            // 重置重连尝试成功连接
            this.reconnectAttempts = 0;
            // 在连接成功时停止当前的心跳检测并重新启动
            this.startHeartbeat();
            this.log('WebSocket', `连接成功,等待服务端数据推送[onopen]...     ${this.url}`);
            this.dispatchEvent('open', event);
        };

        this.socket.onmessage = event => {
            this.dispatchEvent('message', event);
            this.startHeartbeat();
        };

        this.socket.onclose = event => {
            if (this.reconnectAttempts === 0) {
                this.log('WebSocket', `连接断开[onclose]...    ${this.url}`);
            }
            if (!this.stopWs) {
                this.handleReconnect();
            }
            this.dispatchEvent('close', event);
        };

        this.socket.onerror = event => {
            if (this.reconnectAttempts === 0) {
                this.log('WebSocket', `连接异常[onerror]...    ${this.url}`);
            }
            this.closeHeartbeat();
            this.dispatchEvent('error', event);
        };
    }

    // > 断网重连逻辑
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.log('WebSocket', `尝试重连... (${this.reconnectAttempts}/${this.maxReconnectAttempts})       ${this.url}`);
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        } else {
            this.closeHeartbeat();
            this.log('WebSocket', `最大重连失败，终止重连: ${this.url}`);
        }
    }

    // >关闭连接
    close() {
        if (this.socket) {
            this.stopWs = true;
            this.socket.close();
            this.socket = null;
            this.removeEventListener('open');
            this.removeEventListener('message');
            this.removeEventListener('close');
            this.removeEventListener('error');
        }
        this.closeHeartbeat();
    }

    // >开始心跳检测 -> 定时发送心跳消息
    startHeartbeat() {
        if (this.stopWs) return;
        if (this.heartbeatTimer) {
            this.closeHeartbeat();
        }
        this.heartbeatTimer = setInterval(() => {
            if (this.socket) {
                this.socket.send(JSON.stringify({ type: 'heartBeat', data: {} }));
                this.log('WebSocket', '送心跳数据...');
            } else {
                console.error('[WebSocket] 未连接');
            }
        }, this.heartbeatInterval);
    }

    // >关闭心跳
    closeHeartbeat() {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = undefined;
    }
}
```

## ts封装示例

```ts
//// dispatcher.ts
class Log {
    private static console = true;
    log(title: string, text: string) {
        if (!Log.console) return;
        if (import.meta.env.MODE === 'production') return;
        const color = '#ff4d4f';
        console.log(
            `%c ${title} %c ${text} %c`,
            `background:${color};border:1px solid ${color}; padding: 1px; border-radius: 2px 0 0 2px; color: #fff;`,
            `border:1px solid ${color}; padding: 1px; border-radius: 0 2px 2px 0; color: ${color};`,
            'background:transparent'
        );
    }
    closeConsole() {
        Log.console = false;
    }
}
export class EventDispatcher extends Log {
    private listeners: { [type: string]: Function[] } = {};

    protected addEventListener(type: string, listener: Function) {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        if (this.listeners[type].indexOf(listener) === -1) {
            this.listeners[type].push(listener);
        }
    }

    protected removeEventListener(type: string) {
        this.listeners[type] = [];
    }

    protected dispatchEvent(type: string, data: any) {
        const listenerArray = this.listeners[type] || [];
        if (listenerArray.length === 0) return;
        listenerArray.forEach(listener => {
            listener.call(this, data);
        });
    }
}

//// WebSocketClient.ts
import { EventDispatcher } from './dispatcher';

export class WebSocketClient extends EventDispatcher {
    // #socket链接
    private url = '';
    // #socket实例
    private socket: WebSocket | null = null;
    // #重连次数
    private reconnectAttempts = 0;
    // #最大重连数
    private maxReconnectAttempts = 5;
    // #重连间隔
    private reconnectInterval = 10000; // 10 seconds
    // #发送心跳数据间隔
    private heartbeatInterval = 1000 * 30;
    // #计时器id
    private heartbeatTimer?: NodeJS.Timeout;
    // #彻底终止ws
    private stopWs = false;
    // *构造函数
    constructor(url: string) {
        super();
        this.url = url;
    }
    // >生命周期钩子
    onopen(callBack: Function) {
        this.addEventListener('open', callBack);
    }
    onmessage(callBack: Function) {
        this.addEventListener('message', callBack);
    }
    onclose(callBack: Function) {
        this.addEventListener('close', callBack);
    }
    onerror(callBack: Function) {
        this.addEventListener('error', callBack);
    }
    // >消息发送
    public send(message: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        } else {
            console.error('[WebSocket] 未连接');
        }
    }

    // !初始化连接
    public connect(): void {
        if (this.reconnectAttempts === 0) {
            this.log('WebSocket', `初始化连接中...          ${this.url}`);
        }
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }
        this.socket = new WebSocket(this.url);

        // !websocket连接成功
        this.socket.onopen = event => {
            this.stopWs = false;
            // 重置重连尝试成功连接
            this.reconnectAttempts = 0;
            // 在连接成功时停止当前的心跳检测并重新启动
            this.startHeartbeat();
            this.log('WebSocket', `连接成功,等待服务端数据推送[onopen]...     ${this.url}`);
            this.dispatchEvent('open', event);
        };

        this.socket.onmessage = event => {
            this.dispatchEvent('message', event);
            this.startHeartbeat();
        };

        this.socket.onclose = event => {
            if (this.reconnectAttempts === 0) {
                this.log('WebSocket', `连接断开[onclose]...    ${this.url}`);
            }
            if (!this.stopWs) {
                this.handleReconnect();
            }
            this.dispatchEvent('close', event);
        };

        this.socket.onerror = event => {
            if (this.reconnectAttempts === 0) {
                this.log('WebSocket', `连接异常[onerror]...    ${this.url}`);
            }
            this.closeHeartbeat();
            this.dispatchEvent('error', event);
        };
    }

    // > 断网重连逻辑
    private handleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.log('WebSocket', `尝试重连... (${this.reconnectAttempts}/${this.maxReconnectAttempts})       ${this.url}`);
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        } else {
            this.closeHeartbeat();
            this.log('WebSocket', `最大重连失败，终止重连: ${this.url}`);
        }
    }

    // >关闭连接
    public close(): void {
        if (this.socket) {
            this.stopWs = true;
            this.socket.close();
            this.socket = null;
            this.removeEventListener('open');
            this.removeEventListener('message');
            this.removeEventListener('close');
            this.removeEventListener('error');
        }
        this.closeHeartbeat();
    }

    // >开始心跳检测 -> 定时发送心跳消息
    private startHeartbeat(): void {
        if (this.stopWs) return;
        if (this.heartbeatTimer) {
            this.closeHeartbeat();
        }
        this.heartbeatTimer = setInterval(() => {
            if (this.socket) {
                this.socket.send(JSON.stringify({ type: 'heartBeat', data: {} }));
                this.log('WebSocket', '送心跳数据...');
            } else {
                console.error('[WebSocket] 未连接');
            }
        }, this.heartbeatInterval);
    }

    // >关闭心跳
    private closeHeartbeat(): void {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = undefined;
    }
}
```

## 简单node服务端

```bash
# 安装依赖
npm install ws
# 启动服务
node index.js
```

```js
// index.js
const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3200 });

console.log("服务运行在http://localhost:3200/");

wss.on("connection", (ws) => {
  console.log("[服务器]：客官您来了~里边请");
  ws.send(`[websocket云端]您已经连接云端!数据推送中!`);
  let index = 1;
  const interval = setInterval(() => {
    ws.send(`[websocket]数据推送第${index}次`);
    index ++
  }, 1000 * 10);

  ws.on("close", () => {
    clearInterval(interval); // 清除定时器
    console.log("[服务器]：客官下次再来呢~");
  });
});
```

## 实际调用示例

```js
import WebSocketClient from "./WebSocketClient"

// 创建实例
const ws = new WebSocketClient('ws://localhost:3200');

// 连接
ws.connect()
// 同原生方法
ws.onclose(()=>{})
// 同原生方法
ws.onerror(()=>{})
// 同原生方法
ws.onmessage(()=>{
  // 同原生方法
  ws.send("自定义发送的数据")
})
// 同原生方法
ws.onopen(()=>{})

// 关闭连接
ws.close()
```