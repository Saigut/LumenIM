# Talk Client

### 项目介绍

此项目修改自 [Lumen IM](https://github.com/gzydong/LumenIM)， 是 [Saigut/social_server](https://github.com/Saigut/social_server) 的客户端。

### 项目预览

- 地址： [letstalk.ink](https://letstalk.ink)

### 项目安装

###### 下载安装

```bash
## 克隆项目源码包
git clone https://gitee.com/Saigut/LumenIM
或
git clone https://github.com/Saigut/LumenIM

## 安装项目依赖扩展组件
yarn install

# 启动本地开发环境
yarn dev
# 启动本地开发环境桌面客户端
yarn electron:dev

## 生产环境构建项目
yarn build

## 生产环境桌面客户端打包
yarn electron:build
```

###### 关于请求转发
需要将 `/gen_grpc.GrpcApi` 请求转发到 social_server。

以 nginx 为例，如下：
```nginx
server {
    listen       80;
    server_name  www.yourdomain.com;

    root /project-path/dist;
    index  index.html;

    location / {
      try_files $uri $uri/ /index.html;
    }
    
    location /gen_grpc.GrpcApi {
        proxy_pass http://localhost:10080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Content-Type $http_content_type;
    }

    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf|flv|ico)$ {
        expires 7d;
    }

    location ~ .*\.(js|css)?$ {
        expires 7d;
    }
}
```

开发环境可以参考 [vite.config.ts](vite.config.ts) 中的 `server.proxy` 进行配置。