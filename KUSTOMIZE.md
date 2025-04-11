
Apply base.

Apply Dev Patch
```shell
 kubectl apply  -k overlays/dev/
```
```shell
kubectl get elasticsearch
kubectl describe elasticsearch quickstart
``` 


To check the pods:
```shell
kubectl get pods -l elasticsearch.k8s.elastic.co/cluster-name=quickstart
```

For logs:
```shell
kubectl logs -l elasticsearch.k8s.elastic.co/cluster-name=quickstart
```

Examine deployment
```shell
kubectl get elasticsearch quickstart -o yaml > latest-es-example.yaml
```
