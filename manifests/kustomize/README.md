# Elasticsearch Kubernetes Configuration with Kustomize
This guide covers how to manage Elasticsearch deployments on Kubernetes using Kustomize for environment-specific configurations.
## Directory Structure
```
├── base/                  # Base configuration
│   ├── kustomization.yaml
│   └── es-nodes.yaml
│
├── overlays/              # Environment-specific overlays
│   ├── dev/               # Development environment
│   │   ├── kustomization.yaml
│   │   └── patch.yaml
│   └── prod/              # Production environment
│       ├── kustomization.yaml
│       └── patch.yaml
```
## Common Kustomize Commands
### Viewing Generated Resources
```shell
# Preview the base configuration
kubectl kustomize base/

# Preview the development configuration
kubectl kustomize overlays/dev/

```
### Applying Configurations
```shell
# Apply the development configuration
kubectl apply -k overlays/dev/

# Apply the base if you preffer
kubectl apply -k base/
```
### Diffing Configurations
```shell
# Compare the base with development configuration
kubectl diff -k base/ -k overlays/dev/

# Compare development with production configuration
kubectl diff -k overlays/dev/ -k overlays/prod/
```
## Important Considerations
### Namespace Configuration
The namespace must be properly configured in your `kustomization.yaml`:
```shell
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: es-dev  # Uncomment this line

resources:
- ../../base

patches:
  - path: patch.yaml
    target:
      kind: Elasticsearch
      name: quickstart
```
Alternatively, you can explicitly include the namespace in your patch file:
** Note this one does not really work. To be removed.
```shell
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: quickstart
  namespace: es-dev
spec:
  # remaining configuration...
```
### Critical Settings to Preserve
When creating patches, these settings must be explicitly preserved:
1. `initContainers` for system preparation (vm.max_map_count)
2. `accessModes` in volumeClaimTemplates
3. `storageClassName` in volumeClaimTemplates

## Troubleshooting
### Namespace Not Applied
**Problem**: The namespace in `kustomization.yaml` isn't being applied.

**Solution**:
- Ensure the namespace line is uncommented
- Verify with: `kubectl kustomize overlays/dev/ | grep namespace`
- Consider adding the namespace directly in the patch.yaml file

### Missing Configuration After Patching
**Problem**: Important configurations like `initContainers` or storage settings disappear.

**Solution**: Include these critical sections in your patch file:
```shell
# Development environment patch example
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: quickstart
spec:
  nodeSets:
    - name: data-ml-nodes
      count: 1  # Reduced for dev
      podTemplate:
        spec:
          # Always include initContainers
          initContainers:
            - name: sysctl
              securityContext:
                privileged: true
                runAsUser: 0
              command: ['sh', '-c', 'sysctl -w vm.max_map_count=262144']
          
          containers:
            - name: elasticsearch
              resources:
                requests:
                  memory: 2Gi
                  cpu: 2
                limits:
                  memory: 2Gi
      
      # Always include complete volumeClaimTemplates
      volumeClaimTemplates:
        - metadata:
            name: elasticsearch-data
          spec:
            accessModes:
              - ReadWriteOnce
            storageClassName: standard
            resources:
              requests:
                storage: 2Gi
```
### Patching Not Working As Expected
**Problem**: Changes aren't being applied correctly.

**Solutions**:
1. Validate your patches: `kubectl kustomize overlays/dev/ > generated.yaml`
2. Use `kubectl diff -k` to see what's actually changing
3. Ensure your patch structure matches the base resource structure
4. For complex modifications, consider using strategic merge patches or JSON patches

## Best Practices
1. **Always preview changes** with `kubectl kustomize` before applying
2. **Start with small patches** and gradually add complexity
3. **Explicitly include critical sections** in patches (init containers, volume claims)
4. **Use version control** for your Kustomize files
5. **Create separate overlays** for each environment
6. **Document all customizations** in comments

## Examine deployment
 
```shell
kubectl get elasticsearch
kubectl describe elasticsearch quickstart
```

To check the pods:
```shell
kubectl get pods -l elasticsearch.k8s.elastic.co/cluster-name=quickstart
```

Examine logs:
```shell
kubectl logs -l elasticsearch.k8s.elastic.co/cluster-name=quickstart
```
Examine deployment
```shell
kubectl get elasticsearch quickstart -o yaml
```
 

## Verification Commands
```shell
# Validate syntax
kubectl kustomize overlays/dev/ --validate

# List all resources in an overlay
kubectl kustomize overlays/dev/ | grep "kind:"

# Check specific field values
kubectl kustomize overlays/dev/ | grep -A10 "volumeClaimTemplates"
```
## Additional Resources
- [Kustomize Documentation](https://kubectl.docs.kubernetes.io/references/kustomize/)
- [Elastic Cloud on Kubernetes Documentation](https://www.elastic.co/guide/en/cloud-on-k8s/current/index.html)
- [Kustomize Best Practices](https://github.com/kubernetes-sigs/kustomize/tree/master/examples)
