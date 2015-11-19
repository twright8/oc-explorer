package org.devgateway.toolkit.persistence.mongo.repository;

import java.util.List;

import org.devgateway.toolkit.persistence.mongo.dao.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends MongoRepository<Customer, String> {

	public List<Customer> findByFirstName(@Param("firstName")String firstName);

	public List<Customer> findByLastName(@Param("lastName") String lastName);

}