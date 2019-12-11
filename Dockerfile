FROM nginx:latest
COPY ./docs/.vuepress/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
