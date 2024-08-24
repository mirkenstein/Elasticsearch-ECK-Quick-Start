# Minikube Seti[]


```shell
minikube config set memory 65536
minikube config set cpus 16
minikube service │ quickstart-es-http   --url -n elk
minikube service  quickstart-es-http  --url --namespace elk
``` 

```shell
minikube config set memory 65536
❗  These changes will take effect upon a minikube delete and then a minikube start

minikube delete
🙄  "minikube" profile does not exist, trying anyways.
💀  Removed all traces of the "minikube" cluster.
(base) @localhost:~$ minikube start
😄  minikube v1.33.1 on Fedora 40
✨  Automatically selected the docker driver. Other choices: kvm2, qemu2, ssh
📌  Using Docker driver with root privileges
👍  Starting "minikube" primary control-plane node in "minikube" cluster
🚜  Pulling base image v0.0.44 ...
    > gcr.io/k8s-minikube/kicbase...:  481.58 MiB / 481.58 MiB  100.00% 93.42 M
🔥  Creating docker container (CPUs=16, Memory=65536MB) ...
🐳  Preparing Kubernetes v1.30.0 on Docker 26.1.1 ...
    ▪ Generating certificates and keys ...
    ▪ Booting up control plane ...
    ▪ Configuring RBAC rules ...
🔗  Configuring bridge CNI (Container Networking Interface) ...
🔎  Verifying Kubernetes components...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  Enabled addons: storage-provisioner, default-storageclass
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default

```

# Quickstart Elastic ECK
https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-deploy-eck.html

kubectl create -f https://download.elastic.co/downloads/eck/2.13.0/crds.yaml

Set Default Kubectl namespace
https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/#setting-the-namespace-preference
```shell
kubectl config set-context --current --namespace=elk
# Validate it
kubectl config view --minify | grep namespace:
```

```shell
kubectl get secret quickstart-es-elastic-user -o go-template='{{.data.elastic | base64decode }}
```

- Node Port 
https://www.elastic.co/guide/en/cloud-on-k8s/master/k8s-services.html#k8s-allow-public-access

- Mlock
https://www.elastic.co/guide/en/cloud-on-k8s/master/k8s-virtual-memory.html


```shell
es_url_http=$(minikube service  quickstart-es-http  --url --namespace elk )
es_url= https${es_url_http#http} 
es_pass=$(kubectl get secret quickstart-es-elastic-user -o go-template='{{.data.elastic | base64decode }}' --namespace elk)
```
# Eland Import Models
https://www.elastic.co/guide/en/machine-learning/current/ml-nlp-import-model.html
```shell
eland_import_hub_model \
--url $es_url \
-u elastic -p $es_pass \
--hub-model-id sentence-transformers/msmarco-MiniLM-L12-cos-v5 \
--task-type text_embedding \
--insecure


eland_import_hub_model \
--url es_url \
-u elastic -p $es_pass \
--hub-model-id BAAI/bge-large-en-v1.5 \
--task-type text_embedding \
--insecure

eland_import_hub_model \
--url es_url \
-u elastic -p $es_pass \
--hub-model-id BAAI/bge-large-en-v1.5 \
--task-type text_embedding \
--insecure \
--quantize \
--es-model-id baai__bge-large-en-v1.5_quantized 
```
 



