import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';
import { ParameterStore } from 'nodeappmodel';
import { createConnection, EntityManager, getConnection } from 'typeorm';
import { ParameterComponent } from 'nodeapputils/dist/cache/ParameterComponent';

class DBRepositoriesFactory {
  private dbRepositories?: MongoConnectionOptions;
  private urlDB?: string;
  private urlCache?: string;
  private entityManager?: EntityManager;
  private parameterComponent : ParameterComponent;

  public setUrlDB(connectionURI: string) {
    this.urlDB = connectionURI;
  }

  public setUrlCache(connectionURI: string) {
    this.urlCache = connectionURI;
  }

  public async connect() {
    this.dbRepositories = {
      name: 'dbRepository',
      type: 'mongodb',
      url: this.urlDB,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      entities: [ParameterStore],
    };

    await createConnection(this.dbRepositories);
    this.entityManager = getConnection('dbRepository').manager;
    this.parameterComponent = new ParameterComponent(this.urlCache)
  }

  public getValueByKey(key: string): Promise<ParameterStore[]> {
    // return key;
    return this.entityManager!.find(ParameterStore, {
      where: {
        key: { $eq: key },
      },
    });
  }

  public async getValueByKeyAndCountry(key: string, country: string): Promise<ParameterStore | undefined> {
    // return key;
    const value = await this.parameterComponent.getValue(`${key}_${country}`);
    if (value)
      return JSON.parse(value);
    else {
      const parameterStore = await this.entityManager!.findOne(ParameterStore, {
        where: {
          key: { $eq: key },
          country: { $eq: country },
        },
      });
      this.parameterComponent.setValue(`${key}_${country}`, JSON.stringify(parameterStore));
      return parameterStore;
    }
  }

  public async getValueByKeyAndCountryAndService(key: string, country: string, service: string): Promise<ParameterStore | undefined> {
    // return key;
    const value = await this.parameterComponent.getValue(`${service}_${key}_${country}`);
    if (value)
      return JSON.parse(value);
    else {
      const parameterStore = await this.entityManager!.findOne(ParameterStore, {
        where: {
          key: { $eq: key },
          country: { $eq: country },
          service: { $eq: service },
        },
      });
      this.parameterComponent.setValue(`${service}_${key}_${country}`, JSON.stringify(parameterStore));
      return parameterStore;
    }
  }

  public async getValueByKeyAndCountryAndServiceType(key: string, country: string, serviceType: string): Promise<ParameterStore | undefined> {
    // return key;
    const value = await this.parameterComponent.getValue(`${key}_${country}_${serviceType}`);
    if (value)
      return JSON.parse(value);
    else {
      const parameterStore = await this.entityManager!.findOne(ParameterStore, {
        where: {
          key: { $eq: key },
          country: { $eq: country },
          serviceType: { $eq: serviceType },
        },
      });
      this.parameterComponent.setValue(`${key}_${country}_${serviceType}`, JSON.stringify(parameterStore));
      return parameterStore;
    }
  }

  public async insertParameterStore(parameterStore: ParameterStore) {
    await this.entityManager?.save(parameterStore);
  }

  public async updateParameterStore(key: string, country: string, newValue: any, updatedUser: string) {
    let updateState: any = { message: 'Parametro no encontrado, favor revisar que la key y country sean correctos' };
    const findParamerStore = await this.entityManager.findOne(ParameterStore, {
      where: {
        key: { $eq: key },
        country: { $eq: country },
      },
    });

    if (findParamerStore) {

      findParamerStore.updateDate = new Date();
      findParamerStore.value = newValue;
      findParamerStore.updateUser = updatedUser;
      this.entityManager.save(findParamerStore);

      updateState = findParamerStore;
    }

    return updateState;
  }
}

export const dbRepositoriesFactory = new DBRepositoriesFactory();
