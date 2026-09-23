#kubectl describe svc express-prisma-service
#gcloud compute addresses --region=us-central1 create my-static-ip
#gcloud compute addresses describe my-static-ip --region=us-central1 --format="get(address)"
#kubectl describe managedcertificate express-cert
#kubectl describe ingress express-ingress
sel?=
all: cdl delete apply
crush:
	gcloud container clusters create --machine-type=e2-medium --disk-size 50GB --region=asia-southeast1-a crush-on-k8s

cdl:
	gcloud container clusters get-credentials crush-on-k8s --zone=asia-southeast1-a --project=learn-vm-442206

appsel:
	kubectl apply -f $(sel)

delsel:
	kubectl delete -f $(sel)

apply:
	kubectl apply -f all.yaml

delete:
	kubectl delete -f all.yaml

logs:
	kubectl logs -f -l app=express-app -c express-app

https: ingress cert

delete-https: delete-ingress delete-cert

cert:
	kubectl apply -f cert.yaml

delete-cert:
	kubectl delete -f cert.yaml

delete-ingress:
	kubectl delete -f ingress.yaml

ingress:
	kubectl apply -f ingress.yaml