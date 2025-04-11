# Local Cluster Setup with Minikube


 
If we were to deploy a 3 node ECK on a local minikibe cluster.
For this we allocate 16GB memory and 8 CPUs.

Each elasticserch node gets a 4GB memory and 2 CPUs and has all the default
[node roles](https://www.elastic.co/guide/en/elasticsearch/reference/current/node-roles-overview.html) including the  `ml` role. 

To set the resources run:
```shell
minikube config set memory 16384
minikube config set cpus 8
````
These changes will take effect upon a minikube delete and then a minikube start

## Multiple minikube Profiles
If we would like to have dedicated clusters for different experiments we can do so via minikube [profile](https://minikube.sigs.k8s.io/docs/commands/profile/)


$ minikube profile list
```shell
|----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
| Profile  | VM Driver | Runtime |      IP      | Port | Version | Status  | Nodes | Active Profile | Active Kubecontext |
|----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
| minikube | docker    | docker  | 192.168.49.2 | 8443 | v1.30.0 | Running |     1 | *              | *                  |
|----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
```
### Create a new profile

1. Stop the default profile first
```shell
 minikube -p minikube stop
```
2. Start minikube with new profile caled `kustomize`
```shell
 minikube -p kustomize start
```
output
```shell

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
```

3. List the profiles again
```shell
minikube profile list
```
We can see the new profile running. 

```shell
|-----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
|  Profile  | VM Driver | Runtime |      IP      | Port | Version | Status  | Nodes | Active Profile | Active Kubecontext |
|-----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
| kustomize | docker    | docker  | 192.168.58.2 | 8443 | v1.30.0 | Running |     1 |                | *                  |
| minikube  | docker    | docker  | 192.168.49.2 | 8443 | v1.30.0 | Stopped |     1 | *              |                    |
|-----------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
```
 
## Minikube View Service Endpoints

Examine endpoints for deployed services.
```shell
 minikube service  --all  --url --namespace elk -p kustomize
```

