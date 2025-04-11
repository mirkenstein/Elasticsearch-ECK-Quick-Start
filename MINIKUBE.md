# Local Cluster Setup

We will be deploying a 3 node ECK on a local minikibe cluster.
For this we allocate 16GB memory and 8 CPUs.

Each elasticserch node gets a 4GB memory and 2 CPUs and has tall the
[node roles](https://www.elastic.co/guide/en/elasticsearch/reference/current/node-roles-overview.html) including the  `ml` role.

Recommended setup resource limit.
These changes will take effect upon a minikube delete and then a minikube start
```shell
minikube config set memory 16384
minikube config set cpus 6
````
  
## Minikube commands
```shell
 minikube service  --all  --url --namespace elk -p kustomize


$ minikube profile list
```shell
|----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
| Profile  | VM Driver | Runtime |      IP      | Port | Version | Status  | Nodes | Active Profile | Active Kubecontext |
|----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
| minikube | docker    | docker  | 192.168.49.2 | 8443 | v1.30.0 | Running |     1 | *              | *                  |
|----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
```
(base) localhost:~$ minikube -p minikube stop
✋  Stopping node "minikube"  ...
🛑  Powering off "minikube" via SSH ...
🛑  1 node stopped.
(base)  localhost:~$ minikube -p kustomize start
😄  [kustomize] minikube v1.33.1 on Fedora 41
✨  Automatically selected the docker driver. Other choices: qemu2, ssh
📌  Using Docker driver with root privileges
👍  Starting "kustomize" primary control-plane node in "kustomize" cluster
🚜  Pulling base image v0.0.44 ...
🔥  Creating docker container (CPUs=16, Memory=65536MB) ...
🐳  Preparing Kubernetes v1.30.0 on Docker 26.1.1 ...
    ▪ Generating certificates and keys ...
    ▪ Booting up control plane ...
    ▪ Configuring RBAC rules ...
🔗  Configuring bridge CNI (Container Networking Interface) ...
🔎  Verifying Kubernetes components...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  Enabled addons: storage-provisioner, default-storageclass
🏄  Done! kubectl is now configured to use "kustomize" cluster and "default" namespace by default
(base) localhost:~$ minikube profile list
```shell
|-----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
|  Profile  | VM Driver | Runtime |      IP      | Port | Version | Status  | Nodes | Active Profile | Active Kubecontext |
|-----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
| kustomize | docker    | docker  | 192.168.58.2 | 8443 | v1.30.0 | Running |     1 |                | *                  |
| minikube  | docker    | docker  | 192.168.49.2 | 8443 | v1.30.0 | Stopped |     1 | *              |                    |
|-----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
```

