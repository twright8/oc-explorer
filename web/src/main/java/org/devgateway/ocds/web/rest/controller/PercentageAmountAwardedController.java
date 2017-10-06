/*******************************************************************************
 * Copyright (c) 2015 Development Gateway, Inc and others.
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License (MIT)
 * which accompanies this distribution, and is available at
 * https://opensource.org/licenses/MIT
 *
 * Contributors:
 * Development Gateway - initial API and implementation
 *******************************************************************************/
package org.devgateway.ocds.web.rest.controller;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import io.swagger.annotations.ApiOperation;
import java.util.List;
import javax.validation.Valid;
import org.devgateway.ocds.web.rest.controller.request.YearFilterPagingRequest;
import org.devgateway.toolkit.persistence.mongo.aggregate.CustomProjectionOperation;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.util.Assert;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;


import static org.springframework.data.mongodb.core.aggregation.Aggregation.facet;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.group;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.match;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.unwind;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * @author mpostelnicu
 */
@RestController
@CacheConfig(keyGenerator = "genericPagingRequestKeyGenerator", cacheNames = "genericPagingRequestJson")
@Cacheable
public class PercentageAmountAwardedController extends GenericOCDSController {

    public static final class Keys {

    }

    @ApiOperation("")
    @RequestMapping(value = "/api/percentageAmountAwarded",
            method = {RequestMethod.POST, RequestMethod.GET}, produces = "application/json")
    public List<DBObject> percentTendersCancelled(@ModelAttribute @Valid final YearFilterPagingRequest filter) {
        Assert.notEmpty(filter.getProcuringEntityId(), "Must provide at least one procuringEntity!");
        Assert.notEmpty(filter.getSupplierId(), "Must provide at least one supplierId!");
        Aggregation agg = newAggregation(
                match(where("tender.procuringEntity").exists(true).and("awards.suppliers.0").exists(true)
                        .andOperator(getProcuringEntityIdCriteria(filter))),
                unwind("awards"),
                match(where("awards.status").is("active")),
                facet().and(match(getSupplierIdCriteria(filter)),
                        group().sum("awards.value.amount").as("sum")
                ).as("totalAwardedToSuppliers")
                        .and(group().sum("awards.value.amount").as("sum")).as("totalAwarded"),
                unwind("totalAwardedToSuppliers"),
                unwind("totalAwarded"),
                new CustomProjectionOperation(new BasicDBObject("percentage",
                        getPercentageMongoOp("totalAwardedToSuppliers.sum",
                                "totalAwarded.sum")).append("totalAwardedToSuppliers.sum", 1)
                        .append("totalAwarded.sum", 1))
        );

        AggregationResults<DBObject> results = mongoTemplate.aggregate(agg, "release", DBObject.class);
        List<DBObject> list = results.getMappedResults();
        return list;
    }


}