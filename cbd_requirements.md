Povedite računa da arhiva/e ne
budu prevelike, da biste ih mogli upload-ovati. Ovo se postiže tako što u arhivirane projekte, ne
uključujemo build-ovane fajlove (.class fajlovi, kreirane jar/war fajlove, kreirane docker image-e).
Dobra praksa je uraditi mvn clean projekta, pre njegovog pakovanja. Projekat je moguće predati u
sledećim ispitnim rokovima: januar, april, jun, septembar. Odbrana projekata se organizuje u
proseku dva dana nakon predaje projekata, i oko 2 dana pre ispita, u zavisnosti od mogućnosti u
datom isptinom roku. Odbrana je online, svaki student koji je predao projekat, dobija slot od 15
minuta. Potrebno je da se na odbranu uključite sa pokrenutim rešenjem i otvorenim kodom, kako bi
odbrana tekla efikasnije. Potrebno je da imate uključenu kameru prilikom odbrane.
Sadržaj projekta
Projekat je potrebno da sadrži sledeće elemente:
• Domen-specifični mikroservisi (vaša poslvona logika):
◦ Najmanje 3 domen-specifična mikroservisa sa smislenim funkcionalnostima, od kojih
bar 2 komuniciraju sa bazom podataka.
◦ Možete koristiti fakultetsku bazu, svoju lokalnu bazu, ili docker image za bazu.
◦ Obratite pažnju prilikom smišljanja primera, da mikroservisi budu nezavisni. Dakle,
potrebno je da svaki mikroservis ima svoju bazu. Ovo ograničenje možemo malo
“relaksirati”, u smislu da radite sa istom bazom i šemom, ali da budu zasebne tabele.
Ovo može značiti da ćete ponegde imati “duplikat”. Na primer, servis koji radi sa
korisnikom će imati tabelu user, roles i slično, a neki drugi servis će takođe imati tabelu
korisnik, kako bismo akcije korisnika povezali sa onim što imamo u tom servisu. Šeme
baza na nivou servisa treba da imaju bar po 3 tabele.
◦ Kontra primer: Ako imate biblioteku, i napravite 3 tabele: knjiga, iznajmljivanje,
korisnik, i oko toga napravite 3 servisa, gde svaki ima funkcionalnosti vezano za jednu
tabelu, to nije dovoljno dobro razrađen projekat. Za ovakav projekat, možete dobiti
najviše 70% od ukupnog broja predviđenih poena. Bolji pristup bi bio: opisana
Biblioteka kao jedan mikro servis, na primer Dobavljanje kao zaseban servis (ovde na
primer imamo razne dobavljače, koji nude razne knjige, po raznim cenama, i gde imamo
mogućnost naručivanja, praćenja statusa narudžbe... Ovaj servis komunicira sa servisom
Biblioteka, jer je nakon uspešne isporuke, potrebno ažurirati stanje u biblioteci), servis
Plaćanje, Korisnički servis...
◦ Povezivanje mikroservisa uraditi preko Feign-a. Realizovati nekoliko REST endpoint-a.
◦ Potrebno je da budu uključene i neke smislene, složenije operacije, pored običnih
CRUD-ova. To mogu biti operacije, koje imaju složeniju logiku, šalju neke notifikacije i
slično.
◦ Potrebno je obezbediti odgovarajuću validaciju i error handling gde to ima smisla.
• API Gateway: realizacija autentifikacije i autorizacije. Potrebno je da ovde imate Spring
security, filtriranje, upravljanje rutama.
• Naming server: svi servisi treba da budu registrovani na njemu
• Config server: za sve mikroservise, gde ima potrebe.
• Linkove za Docker images za projekte (Config server možete izostaviti) i docker compose
fajl. Pri radu sa Docker-om, config server možete u potpunosti izostaviti, ili koristiti remote
Git repozitorijum, ili koristiti lokalni Git repozitorijum, uz malo dodatnog podešavanja (što
zahteva malo istraživanja).
Dakle, prilikom predaje projekta, upload-ujete zip-ovane sve projekte, i txt fajl sa linkovima za
Docker images i docker-compose fajl.
Možete, a ne morate koristiti fakultetsku bazu podataka na nastavi za sve mikroservise.
Ako vam je arhiva prevelika, clean-ujte projekte, nema potrebe da šaljete build-ovane arhive.